"""Overall form scoring"""
from typing import Dict, List
from ml.form_metrics import FormMetrics


class FormScorer:
    """Calculate overall form score (0-100)"""
    
    def __init__(self, form_metrics: FormMetrics):
        self.form_metrics = form_metrics
    
    def calculate_score(
        self,
        exercise_type: str,
        metrics: Dict,
        issues: List[Dict]
    ) -> int:
        """
        Calculate overall form score (0-100).
        Higher score = better form.
        """
        base_score = 100
        
        # Deduct points for issues
        for issue in issues:
            if issue['severity'] == 'high':
                base_score -= 20
            elif issue['severity'] == 'med':
                base_score -= 10
            elif issue['severity'] == 'low':
                base_score -= 5
        
        # Exercise-specific scoring
        if exercise_type == "squat":
            # Depth score
            depth_ratio = metrics.get('squat_depth_ratio', 0)
            if depth_ratio < 0.5:
                base_score -= 15
            elif depth_ratio < 0.7:
                base_score -= 5
            
            # Valgus penalty
            valgus = metrics.get('knee_valgus_score', 0)
            if valgus > 0.1:
                base_score -= 15
            
            # Torso lean penalty
            lean = metrics.get('torso_lean', 0)
            if lean > 15:
                base_score -= 10
        
        # Stability bonus/penalty
        stability = metrics.get('stability', 0.5)
        if stability < 0.5:
            base_score -= 10
        elif stability > 0.8:
            base_score += 5
        
        # Clamp to 0-100
        return max(0, min(100, base_score))

