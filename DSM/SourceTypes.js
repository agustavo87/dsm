/**
 * Types of Sources of DSM
 * @enum {string} SourceTypes
 */
const SourceTypes = {
    CITATION_DOCUMENT: 'citation-document'
};

/**
 * Determine if the type is valid type of DSM
 * @param {SourceTypes} type Test
 */
function isValidType(type) {
    return (Object.values(SourceTypes).indexOf(type) > -1);
}

export {SourceTypes, isValidType};
