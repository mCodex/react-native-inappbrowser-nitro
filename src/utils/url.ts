const DENIED_SCHEMES = new Set(["javascript", "data", "vbscript"]);
const SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):/i;

/**
 * Validate a URL string before passing it to the native layer.
 * Throws if the URL is empty, missing a scheme, or uses an unsafe scheme.
 */
export const validateUrl = (candidate: string): string => {
	const trimmed = candidate.trim();

	if (!trimmed) {
		throw new Error("URL must be a non-empty string.");
	}

	const schemeMatch = SCHEME_PATTERN.exec(trimmed);
	if (schemeMatch === null) {
		throw new Error("URL must include a valid URI scheme (e.g. https://).");
	}

	const scheme = (schemeMatch[1] ?? "").toLowerCase();

	if (DENIED_SCHEMES.has(scheme)) {
		throw new Error(
			`The URI scheme "${scheme}" is not allowed for security reasons.`,
		);
	}

	return trimmed;
};
