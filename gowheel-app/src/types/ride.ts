export type ImagePosition = 'front' | 'left' | 'right' | 'back' | 'meter';

export interface InspectionImage {
    id: string;
    booking_id: string;
    image_url: string;
    position: ImagePosition;
    uploaded_at: string;
}

export type InspectionType = 'start' | 'end';

export const positionLabels: Record<ImagePosition, string> = {
    front: 'Front View',
    left: 'Left Side',
    right: 'Right Side',
    back: 'Back View',
    meter: 'Odometer/Fuel',
};
