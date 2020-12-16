/**
 * A number, or a string containing a number.
 * @typedef {string} SourceTypes
 */

/**
 * Types of Sources of DSM
 * @readonly
 * @enum {SourcesTypes} SourceTypes
 */
const SourceTypes = {
    CITATION_DOCUMENT: 'citation-document'
};

/**
 * Determine if the type is valid type of DSM
 * @param {SourcesTypes} type Test
 */
function isValidType(type) {
    return (Object.values(SourceTypes).indexOf(type) > -1);
}

export {SourceTypes, isValidType};
