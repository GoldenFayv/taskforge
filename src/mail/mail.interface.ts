export interface IMailData {
    to: string,
    subject: string,
    body: string,
    payload: Record<string, any>
}