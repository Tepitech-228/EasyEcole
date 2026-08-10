export type WizardItemType = {
    text: string
    icon: string
    condition: boolean
    incomplete: boolean
    isBlocked: boolean
    action: Function
};