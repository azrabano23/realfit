"""Form analysis metrics"""
import numpy as np
from typing import List, Dict, Optional
from ml.pose_extractor import PoseExtractor


class FormMetrics:
    """Calculate form-related metrics from pose landmarks"""
    
    def __init__(self, pose_extractor: PoseExtractor):
        self.pose_extractor = pose_extractor
    
    def calculate_squat_metrics(
        self,
        landmarks_list: List[Optional[Dict]]
    ) -> Dict:
        """Calculate squat-specific form metrics"""
        metrics = {}
        
        # Extract knee and hip angles
        knee_angles = []
        hip_angles = []
        knee_positions = []
        
        for landmarks in landmarks_list:
            if landmarks is None:
                continue
            
            angles = self.pose_extractor.get_key_joint_angles(landmarks)
            
            # Knee angles
            left_knee = angles.get('left_knee')
            right_knee = angles.get('right_knee')
            if left_knee is not None and right_knee is not None:
                knee_angles.append((left_knee + right_knee) / 2)
            elif left_knee is not None:
                knee_angles.append(left_knee)
            elif right_knee is not None:
                knee_angles.append(right_knee)
            
            # Hip angles
            left_hip = angles.get('left_hip')
            right_hip = angles.get('right_hip')
            if left_hip is not None and right_hip is not None:
                hip_angles.append((left_hip + right_hip) / 2)
            elif left_hip is not None:
                hip_angles.append(left_hip)
            elif right_hip is not None:
                hip_angles.append(right_hip)
            
            # Knee positions for valgus detection
            if 25 in landmarks and 26 in landmarks:  # Left and right knees
                left_knee_y = landmarks[25]['y']
                right_knee_y = landmarks[26]['y']
                knee_positions.append((left_knee_y, right_knee_y))
        
        if knee_angles:
            max_knee_angle = max(knee_angles)
            min_knee_angle = min(knee_angles)
            metrics['squat_depth_ratio'] = (max_knee_angle - min_knee_angle) / 180.0
            metrics['max_knee_angle'] = max_knee_angle
            metrics['min_knee_angle'] = min_knee_angle
        else:
            metrics['squat_depth_ratio'] = 0.0
        
        # Knee valgus (knee caving in)
        if knee_positions:
            valgus_scores = []
            for left_y, right_y in knee_positions:
                # Calculate horizontal distance between knees
                # Simplified: use y-difference as proxy
                valgus = abs(left_y - right_y)
                valgus_scores.append(valgus)
            metrics['knee_valgus_score'] = np.mean(valgus_scores) if valgus_scores else 0.0
        else:
            metrics['knee_valgus_score'] = 0.0
        
        # Torso lean
        if landmarks_list:
            torso_angles = []
            for landmarks in landmarks_list:
                if landmarks is None:
                    continue
                # Calculate angle between shoulders and hips
                if 11 in landmarks and 12 in landmarks and 23 in landmarks and 24 in landmarks:
                    shoulder_mid_x = (landmarks[11]['x'] + landmarks[12]['x']) / 2
                    shoulder_mid_y = (landmarks[11]['y'] + landmarks[12]['y']) / 2
                    hip_mid_x = (landmarks[23]['x'] + landmarks[24]['x']) / 2
                    hip_mid_y = (landmarks[23]['y'] + landmarks[24]['y']) / 2
                    
                    dx = shoulder_mid_x - hip_mid_x
                    dy = shoulder_mid_y - hip_mid_y
                    angle = np.arctan2(dx, dy) * 180 / np.pi
                    torso_angles.append(abs(angle))
            
            metrics['torso_lean'] = np.mean(torso_angles) if torso_angles else 0.0
        else:
            metrics['torso_lean'] = 0.0
        
        return metrics
    
    def calculate_generic_metrics(
        self,
        landmarks_list: List[Optional[Dict]]
    ) -> Dict:
        """Calculate generic metrics for unknown exercises"""
        metrics = {}
        
        # Movement intensity (overall displacement)
        intensities = []
        prev_landmarks = None
        
        for landmarks in landmarks_list:
            if landmarks is None:
                intensities.append(0)
                prev_landmarks = None
                continue
            
            if prev_landmarks is None:
                intensities.append(0)
                prev_landmarks = landmarks
                continue
            
            total_displacement = 0
            count = 0
            for idx in landmarks.keys():
                if idx in prev_landmarks:
                    dx = landmarks[idx]['x'] - prev_landmarks[idx]['x']
                    dy = landmarks[idx]['y'] - prev_landmarks[idx]['y']
                    displacement = np.sqrt(dx**2 + dy**2)
                    total_displacement += displacement
                    count += 1
            
            intensity = total_displacement / count if count > 0 else 0
            intensities.append(intensity)
            prev_landmarks = landmarks
        
        if intensities:
            metrics['movement_intensity'] = np.mean(intensities)
            metrics['movement_intensity_max'] = np.max(intensities)
        else:
            metrics['movement_intensity'] = 0.0
            metrics['movement_intensity_max'] = 0.0
        
        # Range of motion proxy (variance in key joint positions)
        if landmarks_list:
            key_joints = [11, 12, 23, 24, 25, 26]  # Shoulders, hips, knees
            rom_scores = []
            
            for joint_idx in key_joints:
                positions = []
                for landmarks in landmarks_list:
                    if landmarks and joint_idx in landmarks:
                        positions.append((landmarks[joint_idx]['x'], landmarks[joint_idx]['y']))
                
                if len(positions) > 1:
                    positions = np.array(positions)
                    x_range = np.max(positions[:, 0]) - np.min(positions[:, 0])
                    y_range = np.max(positions[:, 1]) - np.min(positions[:, 1])
                    rom = np.sqrt(x_range**2 + y_range**2)
                    rom_scores.append(rom)
            
            metrics['rom_proxy'] = np.mean(rom_scores) if rom_scores else 0.0
        else:
            metrics['rom_proxy'] = 0.0
        
        # Stability (variance in center of mass)
        if landmarks_list:
            com_positions = []
            for landmarks in landmarks_list:
                if landmarks is None:
                    continue
                
                # Calculate center of mass from torso landmarks
                torso_joints = [11, 12, 23, 24]  # Shoulders and hips
                x_coords = []
                y_coords = []
                
                for joint_idx in torso_joints:
                    if joint_idx in landmarks:
                        x_coords.append(landmarks[joint_idx]['x'])
                        y_coords.append(landmarks[joint_idx]['y'])
                
                if x_coords and y_coords:
                    com_x = np.mean(x_coords)
                    com_y = np.mean(y_coords)
                    com_positions.append((com_x, com_y))
            
            if len(com_positions) > 1:
                com_array = np.array(com_positions)
                x_std = np.std(com_array[:, 0])
                y_std = np.std(com_array[:, 1])
                metrics['stability'] = 1.0 / (1.0 + np.sqrt(x_std**2 + y_std**2))  # Inverse of instability
            else:
                metrics['stability'] = 0.0
        else:
            metrics['stability'] = 0.0
        
        return metrics
    
    def detect_issues(
        self,
        landmarks_list: List[Optional[Dict]],
        exercise_type: str,
        metrics: Dict,
        fps: float = 30.0
    ) -> List[Dict]:
        """Detect form issues and return list of issues with severity"""
        issues = []
        
        if exercise_type == "squat":
            # Check depth
            if metrics.get('squat_depth_ratio', 0) < 0.5:
                issues.append({
                    'severity': 'high',
                    'message': 'Squat depth insufficient - aim to go lower',
                    'timestamp_s': None
                })
            elif metrics.get('squat_depth_ratio', 0) < 0.7:
                issues.append({
                    'severity': 'med',
                    'message': 'Could go deeper for better range of motion',
                    'timestamp_s': None
                })
            
            # Check knee valgus
            if metrics.get('knee_valgus_score', 0) > 0.1:
                issues.append({
                    'severity': 'high',
                    'message': 'Knee valgus detected - knees caving inward',
                    'timestamp_s': None
                })
            
            # Check torso lean
            if metrics.get('torso_lean', 0) > 15:
                issues.append({
                    'severity': 'med',
                    'message': 'Excessive forward lean - keep torso more upright',
                    'timestamp_s': None
                })
        
        # Generic issues
        if metrics.get('stability', 1.0) < 0.5:
            issues.append({
                'severity': 'med',
                'message': 'Instability detected - focus on balance',
                'timestamp_s': None
            })
        
        return issues

