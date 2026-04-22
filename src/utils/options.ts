import type {
	BrowserAnimations,
	DynamicColor,
	InAppBrowserOptions,
} from "../types";

/**
 * Return `obj` when it has at least one own key, otherwise `undefined`.
 * Used to elide empty nested payloads before they cross JSI.
 */
const compact = <T extends object>(obj: T): T | undefined =>
	Object.keys(obj).length > 0 ? obj : undefined;

/**
 * Copy whitelisted string fields from `source` into a new object, trimming
 * each value and dropping empty or non-string entries.
 */
const trimStringFields = <T extends object>(
	source: T,
	keys: readonly (keyof T)[],
): Partial<T> => {
	const out: Partial<T> = {};
	for (const key of keys) {
		const value = source[key];
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (trimmed) {
				out[key] = trimmed as T[keyof T];
			}
		}
	}
	return out;
};

const DYNAMIC_COLOR_KEYS = [
	"base",
	"light",
	"dark",
	"highContrast",
] as const satisfies readonly (keyof DynamicColor)[];

const ANIMATION_KEYS = [
	"startEnter",
	"startExit",
	"endEnter",
	"endExit",
] as const satisfies readonly (keyof BrowserAnimations)[];

const sanitizeColor = (value: DynamicColor): DynamicColor | undefined =>
	compact(trimStringFields(value, DYNAMIC_COLOR_KEYS));

const sanitizeAnimations = (
	value: BrowserAnimations,
): BrowserAnimations | undefined =>
	compact(trimStringFields(value, ANIMATION_KEYS));

const sanitizeHeaders = (
	headers: Record<string, string>,
): Record<string, string> | undefined => {
	const out: Record<string, string> = {};
	for (const key of Object.keys(headers)) {
		const value = headers[key];
		if (typeof value !== "string") continue;
		const normalizedKey = key.trim();
		if (!normalizedKey) continue;
		out[normalizedKey] = value;
	}
	return compact(out);
};

/**
 * Per-key normalizers. Each handler receives the raw value and returns the
 * sanitized value, or `undefined` to omit the field entirely.
 */
type Normalizer<K extends keyof InAppBrowserOptions> = (
	value: NonNullable<InAppBrowserOptions[K]>,
) => InAppBrowserOptions[K];

type NormalizerMap = {
	[K in keyof InAppBrowserOptions]?: Normalizer<K>;
};

const NORMALIZERS: NormalizerMap = {
	preferredBarTintColor: sanitizeColor,
	preferredControlTintColor: sanitizeColor,
	toolbarColor: sanitizeColor,
	secondaryToolbarColor: sanitizeColor,
	navigationBarColor: sanitizeColor,
	navigationBarDividerColor: sanitizeColor,
	headers: sanitizeHeaders,
	animations: sanitizeAnimations,
};

/**
 * Remove `undefined`/`null` entries and sanitize nested values before the
 * options object is bridged to the native hybrid module.
 *
 * Fast path: when no options are supplied, returns `undefined` without any
 * allocations.
 */
export const normalizeOptions = (
	options?: InAppBrowserOptions,
): InAppBrowserOptions | undefined => {
	if (!options) return undefined;

	const out: InAppBrowserOptions = {};
	for (const key of Object.keys(options)) {
		const typedKey = key as keyof InAppBrowserOptions;
		const value = options[typedKey];
		if (value === undefined || value === null) continue;

		const normalizer = NORMALIZERS[typedKey] as
			| ((v: unknown) => unknown)
			| undefined;
		const next = normalizer ? normalizer(value) : value;
		if (next === undefined) continue;

		// Per-key correctness is guaranteed by the typed `NORMALIZERS` map above.
		(out as Record<string, unknown>)[typedKey] = next;
	}

	return compact(out);
};
