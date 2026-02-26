// utils/csc.ts
import { Country, State, City } from 'country-state-city'

export interface CSCOption {
    label: string
    value: string
}

export const getAllCountries = (): CSCOption[] => {
    return Country.getAllCountries().map((c) => ({
        label: c.name,
        value: c.isoCode, // e.g. "IN"
    }))
}

export const getStatesByCountry = (countryIso: string): CSCOption[] => {
    if (!countryIso) return []
    return State.getStatesOfCountry(countryIso).map((s) => ({
        label: s.name,
        value: s.isoCode, // e.g. "MH"
    }))
}

export const getCitiesByState = (countryIso: string, stateIso: string): CSCOption[] => {
    if (!countryIso || !stateIso) return []
    return City.getCitiesOfState(countryIso, stateIso).map((c) => ({
        label: c.name,
        value: c.name, // store/display city name
    }))
}

// For view-mode display (map ISO → full name)
export const getCountryName = (isoCode?: string | null): string => {
    if (!isoCode) return ''
    const c = Country.getCountryByCode(isoCode)
    return c?.name ?? isoCode
}

export const getStateName = (countryIso?: string | null, stateIso?: string | null): string => {
    if (!countryIso || !stateIso) return stateIso || ''
    const s = State.getStateByCodeAndCountry(stateIso, countryIso)
    return s?.name ?? stateIso
}
