import { type TypeOf, object, string } from "zod";

// Códigos postales de Baleares (07), Canarias (35, 38), Ceuta (51) y Melilla
// (52): por ahora solo se envía a España peninsular (ver /legal/condiciones,
// además esos territorios tienen IGIC/IPSI en vez de IVA). Stripe solo deja
// restringir el AddressElement por país (allowedCountries: ["ES"]), no por
// región, así que la zona exacta se valida aquí.
const NON_PENINSULAR_PROVINCE_PREFIXES = new Set(["07", "35", "38", "51", "52"]);

function isPeninsularSpainPostalCode(postalCode: string): boolean {
	const trimmed = postalCode.trim();
	return /^\d{5}$/.test(trimmed) && !NON_PENINSULAR_PROVINCE_PREFIXES.has(trimmed.slice(0, 2));
}

export const getAddressSchema = (tr: {
	nameRequired: string;
	cityRequired: string;
	countryRequired: string;
	line1Required: string;
	postalCodeRequired: string;
	onlyPeninsularSpain: string;
}) => {
	const addressSchema = object({
		name: string({ required_error: tr.nameRequired }).min(1, tr.nameRequired),
		city: string({ required_error: tr.cityRequired }).min(1, tr.cityRequired),
		country: string({ required_error: tr.countryRequired }).min(1, tr.countryRequired),
		line1: string({ required_error: tr.line1Required }).min(1, tr.line1Required),
		line2: string().optional().nullable().default(""),
		postalCode: string({ required_error: tr.postalCodeRequired }).min(1, tr.postalCodeRequired),
		state: string().optional().nullable().default(""),
		phone: string().optional().nullable().default(""),
		email: string().optional().nullable().default(""),
		// 	.email("Email is required")
		// 	.min(1, "Email is required"),
	}).refine((data) => data.country === "ES" && isPeninsularSpainPostalCode(data.postalCode), {
		message: tr.onlyPeninsularSpain,
		path: ["postalCode"],
	});
	return addressSchema;
};

export type AddressSchema = TypeOf<ReturnType<typeof getAddressSchema>>;
