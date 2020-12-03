
/**
 * Types of Sources of DSM
 * @readonly
 * @enum {string}
 */
const SourceTypes = {
    CITATION_DOCUMENT: 'citation-document'
};

/**
 * Determine if the type is valid type of DSM
 * @param {string} type Test
 */
function isValidType(type) {
    return (Object.values(SourceTypes).indexOf(type) > -1);
}

export {SourceTypes, isValidType};
