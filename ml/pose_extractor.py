"""Pose estimation using MediaPipe Pose"""
import cv2
import mediapipe as mp
import numpy as np
from typing import List, Dict, Optional, Tuple
import sys
import os

# Add parent directory for config access
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


class PoseExtractor:
    """Extract pose landmarks from video frames using MediaPipe"""
    
    def __init__(self, model_complexity: int = 1):
        """Initialize pose extractor with MediaPipe Pose
        
        Args:
            model_complexity: 0 (lite), 1 (full), or 2 (heavy) - higher is more accurate but slower
        """
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            enable_segmentation=False,
            smooth_landmarks=True,  # Enable built-in smoothing
            min_detection_confidence=0.7,  # Increased for better quality
            min_tracking_confidence=0.7    # Increased for better quality
        )
        self.mp_drawing = mp.solutions.drawing_utils
    
    def extract_landmarks(self, frame: np.ndarray) -> Optional[Dict]:
        """
        Extract pose landmarks from a single frame.
        Returns dict with landmark coordinates and visibility scores.
        """
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb_frame)
        
        if not results.pose_landmarks:
            return None
        
        landmarks = {}
        for idx, landmark in enumerate(results.pose_landmarks.landmark):
            landmarks[idx] = {
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'visibility': landmark.visibility
            }
        
        return landmarks
    
    def extract_from_video(self, video_path: str) -> List[Optional[Dict]]:
        """
        Extract pose landmarks from all frames in a video.
        Returns list of landmark dicts (one per frame).
        """
        cap = cv2.VideoCapture(video_path)
        landmarks_list = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            landmarks = self.extract_landmarks(frame)
            landmarks_list.append(landmarks)
        
        cap.release()
        return landmarks_list
    
    def smooth_landmarks(
        self,
        landmarks_list: List[Optional[Dict]],
        alpha: float = 0.7,
        min_visibility: float = 0.5
    ) -> List[Optional[Dict]]:
        """
        Apply exponential moving average smoothing to landmarks.
        
        Args:
            landmarks_list: List of landmark dictionaries per frame
            alpha: smoothing factor (0-1), higher = less smoothing
            min_visibility: minimum visibility threshold to use landmark
        """
        if not landmarks_list:
            return []
        
        smoothed = []
        prev_landmarks = None
        
        for landmarks in landmarks_list:
            if landmarks is None:
                smoothed.append(None)
                continue
            
            if prev_landmarks is None:
                smoothed.append(landmarks)
                prev_landmarks = landmarks
                continue
            
            # Smooth each landmark
            smoothed_frame = {}
            for idx in landmarks.keys():
                # Only use landmarks with sufficient visibility
                if landmarks[idx]['visibility'] < min_visibility:
                    if idx in prev_landmarks:
                        # Use previous value if current is low confidence
                        smoothed_frame[idx] = prev_landmarks[idx]
                    else:
                        smoothed_frame[idx] = landmarks[idx]
                    continue
                
                if idx in prev_landmarks and prev_landmarks[idx]['visibility'] >= min_visibility:
                    # Apply exponential smoothing
                    smoothed_frame[idx] = {
                        'x': alpha * landmarks[idx]['x'] + (1 - alpha) * prev_landmarks[idx]['x'],
                        'y': alpha * landmarks[idx]['y'] + (1 - alpha) * prev_landmarks[idx]['y'],
                        'z': alpha * landmarks[idx]['z'] + (1 - alpha) * prev_landmarks[idx]['z'],
                        'visibility': landmarks[idx]['visibility']
                    }
                else:
                    smoothed_frame[idx] = landmarks[idx]
            
            smoothed.append(smoothed_frame)
            prev_landmarks = smoothed_frame
        
        return smoothed
    
    def get_joint_angle(
        self,
        landmarks: Dict,
        joint_idx: int,
        point1_idx: int,
        point2_idx: int
    ) -> Optional[float]:
        """
        Calculate angle at a joint given three landmark indices.
        Returns angle in degrees.
        """
        if joint_idx not in landmarks or point1_idx not in landmarks or point2_idx not in landmarks:
            return None
        
        # Get points
        p1 = landmarks[point1_idx]
        p2 = landmarks[joint_idx]
        p3 = landmarks[point2_idx]
        
        # Check visibility
        if p1['visibility'] < 0.5 or p2['visibility'] < 0.5 or p3['visibility'] < 0.5:
            return None
        
        # Calculate vectors
        v1 = np.array([p1['x'] - p2['x'], p1['y'] - p2['y']])
        v2 = np.array([p3['x'] - p2['x'], p3['y'] - p2['y']])
        
        # Calculate angle
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8)
        cos_angle = np.clip(cos_angle, -1.0, 1.0)
        angle = np.arccos(cos_angle) * 180 / np.pi
        
        return angle
    
    def get_key_joint_angles(self, landmarks: Dict) -> Dict[str, Optional[float]]:
        """
        Get key joint angles for form analysis.
        MediaPipe pose landmark indices:
        - Left/Right shoulder: 11, 12
        - Left/Right elbow: 13, 14
        - Left/Right wrist: 15, 16
        - Left/Right hip: 23, 24
        - Left/Right knee: 25, 26
        - Left/Right ankle: 27, 28
        """
        angles = {}
        
        # Left arm angles
        if 11 in landmarks and 13 in landmarks and 15 in landmarks:
            angles['left_elbow'] = self.get_joint_angle(landmarks, 13, 11, 15)
        
        # Right arm angles
        if 12 in landmarks and 14 in landmarks and 16 in landmarks:
            angles['right_elbow'] = self.get_joint_angle(landmarks, 14, 12, 16)
        
        # Left leg angles
        if 23 in landmarks and 25 in landmarks and 27 in landmarks:
            angles['left_knee'] = self.get_joint_angle(landmarks, 25, 23, 27)
            angles['left_hip'] = self.get_joint_angle(landmarks, 23, 11, 25)  # Hip angle
        
        # Right leg angles
        if 24 in landmarks and 26 in landmarks and 28 in landmarks:
            angles['right_knee'] = self.get_joint_angle(landmarks, 26, 24, 28)
            angles['right_hip'] = self.get_joint_angle(landmarks, 24, 12, 26)  # Hip angle
        
        return angles


