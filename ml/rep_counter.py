"""Rep counting logic using joint angle trajectories"""
import numpy as np
from typing import List, Dict, Optional, Tuple
from scipy.signal import find_peaks, savgol_filter
from ml.pose_extractor import PoseExtractor


class RepCounter:
    """Count repetitions from pose landmark sequences"""
    
    def __init__(self, pose_extractor: PoseExtractor):
        self.pose_extractor = pose_extractor
    
    def count_reps_squat(
        self,
        landmarks_list: List[Optional[Dict]],
        fps: float = 30.0
    ) -> Tuple[int, List[float]]:
        """
        Count squat repetitions using knee and hip angles.
        Returns (rep_count, rep_times)
        """
        # Extract knee angles over time
        knee_angles = []
        hip_angles = []
        
        for landmarks in landmarks_list:
            if landmarks is None:
                knee_angles.append(None)
                hip_angles.append(None)
                continue
            
            angles = self.pose_extractor.get_key_joint_angles(landmarks)
            left_knee = angles.get('left_knee')
            right_knee = angles.get('right_knee')
            left_hip = angles.get('left_hip')
            right_hip = angles.get('right_hip')
            
            # Use average of left/right if available
            knee_angle = None
            if left_knee is not None and right_knee is not None:
                knee_angle = (left_knee + right_knee) / 2
            elif left_knee is not None:
                knee_angle = left_knee
            elif right_knee is not None:
                knee_angle = right_knee
            
            hip_angle = None
            if left_hip is not None and right_hip is not None:
                hip_angle = (left_hip + right_hip) / 2
            elif left_hip is not None:
                hip_angle = left_hip
            elif right_hip is not None:
                hip_angle = right_hip
            
            knee_angles.append(knee_angle)
            hip_angles.append(hip_angle)
        
        # Use knee angle for rep counting (more reliable for squats)
        angle_series = self._interpolate_missing(knee_angles)
        if len(angle_series) < 10:
            return 0, []
        
        # Apply Savitzky-Golay filter for better smoothing
        window_length = min(11, len(angle_series) if len(angle_series) % 2 == 1 else len(angle_series) - 1)
        if window_length >= 5:
            angle_series = savgol_filter(angle_series, window_length, 3)
        
        # Find peaks (bottom of squat = maximum knee angle)
        # Invert signal to find peaks (we want to find when knee is most bent)
        inverted = np.max(angle_series) - angle_series
        
        # Dynamic prominence threshold based on signal characteristics
        angle_range = np.max(angle_series) - np.min(angle_series)
        prominence_threshold = max(angle_range * 0.3, np.std(angle_series) * 0.6)
        
        # Find peaks with minimum distance (at least 1 second between reps)
        min_distance = int(fps * 1.0)
        peaks, properties = find_peaks(
            inverted,
            distance=min_distance,
            prominence=prominence_threshold,
            height=np.percentile(inverted, 30)  # Must be at least 30th percentile
        )
        
        rep_count = len(peaks)
        rep_times = [p / fps for p in peaks]
        
        return rep_count, rep_times
    
    def count_reps_deadlift(
        self,
        landmarks_list: List[Optional[Dict]],
        fps: float = 30.0
    ) -> Tuple[int, List[float]]:
        """
        Count deadlift repetitions using hip angle.
        """
        hip_angles = []
        
        for landmarks in landmarks_list:
            if landmarks is None:
                hip_angles.append(None)
                continue
            
            angles = self.pose_extractor.get_key_joint_angles(landmarks)
            left_hip = angles.get('left_hip')
            right_hip = angles.get('right_hip')
            
            hip_angle = None
            if left_hip is not None and right_hip is not None:
                hip_angle = (left_hip + right_hip) / 2
            elif left_hip is not None:
                hip_angle = left_hip
            elif right_hip is not None:
                hip_angle = right_hip
            
            hip_angles.append(hip_angle)
        
        angle_series = self._interpolate_missing(hip_angles)
        if len(angle_series) < 10:
            return 0, []
        
        # Apply Savitzky-Golay filter
        window_length = min(11, len(angle_series) if len(angle_series) % 2 == 1 else len(angle_series) - 1)
        if window_length >= 5:
            angle_series = savgol_filter(angle_series, window_length, 3)
        
        # Deadlift: find when hips are lowest (highest angle)
        angle_range = np.max(angle_series) - np.min(angle_series)
        prominence_threshold = max(angle_range * 0.3, np.std(angle_series) * 0.6)
        
        peaks, _ = find_peaks(
            angle_series,
            distance=int(fps * 1.0),
            prominence=prominence_threshold,
            height=np.percentile(angle_series, 40)
        )
        
        rep_count = len(peaks)
        rep_times = [p / fps for p in peaks]
        
        return rep_count, rep_times
    
    def count_reps_bench(
        self,
        landmarks_list: List[Optional[Dict]],
        fps: float = 30.0
    ) -> Tuple[int, List[float]]:
        """
        Count bench press repetitions using elbow angles.
        """
        elbow_angles = []
        
        for landmarks in landmarks_list:
            if landmarks is None:
                elbow_angles.append(None)
                continue
            
            angles = self.pose_extractor.get_key_joint_angles(landmarks)
            left_elbow = angles.get('left_elbow')
            right_elbow = angles.get('right_elbow')
            
            elbow_angle = None
            if left_elbow is not None and right_elbow is not None:
                elbow_angle = (left_elbow + right_elbow) / 2
            elif left_elbow is not None:
                elbow_angle = left_elbow
            elif right_elbow is not None:
                elbow_angle = right_elbow
            
            elbow_angles.append(elbow_angle)
        
        angle_series = self._interpolate_missing(elbow_angles)
        if len(angle_series) < 10:
            return 0, []
        
        # Apply Savitzky-Golay filter
        window_length = min(11, len(angle_series) if len(angle_series) % 2 == 1 else len(angle_series) - 1)
        if window_length >= 5:
            angle_series = savgol_filter(angle_series, window_length, 3)
        
        # Bench: find when elbows are most bent (bottom of rep)
        inverted = np.max(angle_series) - angle_series
        angle_range = np.max(angle_series) - np.min(angle_series)
        prominence_threshold = max(angle_range * 0.3, np.std(angle_series) * 0.6)
        
        peaks, _ = find_peaks(
            inverted,
            distance=int(fps * 1.0),
            prominence=prominence_threshold,
            height=np.percentile(inverted, 30)
        )
        
        rep_count = len(peaks)
        rep_times = [p / fps for p in peaks]
        
        return rep_count, rep_times
    
    def count_reps_overhead_press(
        self,
        landmarks_list: List[Optional[Dict]],
        fps: float = 30.0
    ) -> Tuple[int, List[float]]:
        """
        Count overhead press repetitions using elbow angles and wrist height.
        """
        # Similar to bench but track upward movement
        return self.count_reps_bench(landmarks_list, fps)
    
    def count_reps_unknown(
        self,
        landmarks_list: List[Optional[Dict]],
        fps: float = 30.0
    ) -> Tuple[int, List[float]]:
        """
        Generic rep counting for unknown exercises.
        Uses overall movement intensity.
        """
        # Calculate movement intensity per frame
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
            
            # Calculate total displacement
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
        
        if len(intensities) < 10:
            return 0, []
        
        # Find peaks in movement intensity
        intensity_array = np.array(intensities)
        peaks, _ = find_peaks(
            intensity_array,
            distance=int(fps * 0.5),
            prominence=np.std(intensity_array) * 0.3
        )
        
        # Estimate reps (rough heuristic)
        rep_count = max(0, len(peaks) // 2)  # Each rep has up/down movement
        rep_times = [p / fps for p in peaks[::2]]  # Take every other peak
        
        return rep_count, rep_times
    
    def _interpolate_missing(self, values: List[Optional[float]]) -> np.ndarray:
        """Interpolate missing values in a time series"""
        arr = np.array([v if v is not None else np.nan for v in values])
        
        # Forward fill then backward fill
        mask = ~np.isnan(arr)
        if not np.any(mask):
            return np.zeros(len(arr))
        
        # Simple interpolation
        indices = np.arange(len(arr))
        arr = np.interp(indices, indices[mask], arr[mask])
        
        return arr

