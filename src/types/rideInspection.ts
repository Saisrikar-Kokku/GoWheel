// Ride inspection types for security image uploads

export type InspectionType = 'pre_ride' | 'post_ride';
export type ImagePosition = 'front' | 'left' | 'right' | 'back' | 'meter' | 'damage';

export interface RideInspectionImage {
    id: string;
    booking_id: string;
    image_url: string;
    position: ImagePosition;
    inspection_type: InspectionType;
    uploaded_by: string; // user_id
    uploaded_by_role: 'renter' | 'owner';
    notes?: string;
    created_at: string;
}

export interface RideInspectionUpload {
    booking_id: string;
    position: ImagePosition;
    inspection_type: InspectionType;
    file: File;
    notes?: string;
}

// Required positions for pre-ride inspection
export const REQUIRED_PRE_RIDE_POSITIONS: ImagePosition[] = ['front', 'left', 'right'];

// Validation for inspection completion
export interface InspectionValidation {
    isComplete: boolean;
    missingPositions: ImagePosition[];
    uploadedPositions: ImagePosition[];
}

// Position labels for UI
export const positionLabels: Record<ImagePosition, { label: string; description: string; icon: string }> = {
    front: {
        label: 'Front View',
        description: 'Clear photo of the front of the vehicle',
        icon: '⬆️',
    },
    left: {
        label: 'Left Side',
        description: 'Photo showing the left side of the vehicle',
        icon: '⬅️',
    },
    right: {
        label: 'Right Side',
        description: 'Photo showing the right side of the vehicle',
        icon: '➡️',
    },
    back: {
        label: 'Back View',
        description: 'Clear photo of the back of the vehicle',
        icon: '⬇️',
    },
    meter: {
        label: 'Odometer',
        description: 'Photo of the odometer/meter reading',
        icon: '🔢',
    },
    damage: {
        label: 'Existing Damage',
        description: 'Photo of any existing damage (optional)',
        icon: '⚠️',
    },
};

// Helper function to validate inspection
export function validateInspection(
    images: RideInspectionImage[],
    inspectionType: InspectionType
): InspectionValidation {
    const requiredPositions = inspectionType === 'pre_ride' 
        ? REQUIRED_PRE_RIDE_POSITIONS 
        : REQUIRED_PRE_RIDE_POSITIONS;
    
    const uploadedPositions = images
        .filter(img => img.inspection_type === inspectionType)
        .map(img => img.position);
    
    const missingPositions = requiredPositions.filter(
        pos => !uploadedPositions.includes(pos)
    );
    
    return {
        isComplete: missingPositions.length === 0,
        missingPositions,
        uploadedPositions,
    };
}

// Default security deposit text
export const DEFAULT_SECURITY_DEPOSIT_TEXT = `Security Deposit Required:
• Original RC Book OR
• ₹5,000 cash (fully refundable after ride completion)

The deposit ensures vehicle safety and will be returned upon successful ride completion with no damages.`;
