// Ride inspection types — mirrors the website exactly

export type InspectionType = 'pre_ride' | 'post_ride';
export type ImagePosition = 'front' | 'left' | 'right' | 'back' | 'meter' | 'damage';

export interface RideInspectionImage {
    id: string;
    booking_id: string;
    image_url: string;
    position: ImagePosition;
    inspection_type: InspectionType;
    uploaded_by: string;
    uploaded_by_role: 'renter' | 'owner';
    notes?: string;
    created_at: string;
}

export const REQUIRED_PRE_RIDE_POSITIONS: ImagePosition[] = ['front', 'left', 'right'];

export interface InspectionValidation {
    isComplete: boolean;
    missingPositions: ImagePosition[];
    uploadedPositions: ImagePosition[];
}

export const positionLabels: Record<ImagePosition, { label: string; description: string; icon: string }> = {
    front: { label: 'Front View', description: 'Clear photo of the front of the vehicle', icon: '⬆️' },
    left: { label: 'Left Side', description: 'Photo showing the left side', icon: '⬅️' },
    right: { label: 'Right Side', description: 'Photo showing the right side', icon: '➡️' },
    back: { label: 'Back View', description: 'Clear photo of the back', icon: '⬇️' },
    meter: { label: 'Odometer', description: 'Photo of the odometer reading', icon: '🔢' },
    damage: { label: 'Existing Damage', description: 'Any existing damage (optional)', icon: '⚠️' },
};

export function validateInspection(images: RideInspectionImage[], inspectionType: InspectionType): InspectionValidation {
    const uploadedPositions = images.filter(img => img.inspection_type === inspectionType).map(img => img.position);
    const missingPositions = REQUIRED_PRE_RIDE_POSITIONS.filter(pos => !uploadedPositions.includes(pos));
    return { isComplete: missingPositions.length === 0, missingPositions, uploadedPositions };
}

export const DEFAULT_SECURITY_DEPOSIT_TEXT = `Security Deposit Required:
• Original RC Book OR
• ₹5,000 cash (fully refundable after ride completion)

The deposit ensures vehicle safety and will be returned upon successful ride completion with no damages.`;
