export type WizardItemType = {
    text: string
    condition: boolean
    incomplete: boolean
    isBlocked: boolean
    action: Function
};