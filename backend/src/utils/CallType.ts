type CallType = {
    userId? : string,
    specialization?: string,
    doctorId? : string,
    date?: string,
    slot?: string,
    slots?: any[],
    availableDates?: string[]
}

export const callMemoryStore : Record<string, CallType> = {}