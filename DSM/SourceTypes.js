const SourceTypes = {
    CITATION_DOCUMENT: 'citation-document'
};

function isValidType(type) {
    return (Object.values(SourceTypes).indexOf(type) > -1);
}

export {SourceTypes, isValidType};
