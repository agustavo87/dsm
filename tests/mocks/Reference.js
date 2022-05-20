// For mocking References without depending on DOM or Quill Blots.
const Reference = jest.fn(function (properties) {
    properties = {
        blot: {},
        key: 'a4',
        type: 'citation-document',
        index: 12,
        ...properties
    }
    
    const Ref = {};

    Ref._id = ++StaticReference.lastId;

    Object.defineProperty(Ref, 'blot', {
        get: jest.fn(() => {
            return properties.blot
        })
    });
    Object.defineProperty(Ref, 'key', {
        get: jest.fn(() => properties.key)
    });
    Object.defineProperty(Ref, 'type', {
        get: jest.fn(() => properties.type)
    });
    Object.defineProperty(Ref, 'index', {
        get: jest.fn(() => properties.index)
    });
    Object.defineProperty(Ref, 'id', {
        get: jest.fn(function () {
            return this._id
        })
    });
    return Ref;
})

export default Reference;

export const StaticReference = {
    lastId: -1
}

/**
 * Data for create an array of mock Reference objects
 * 
 * @typedef {Object} RefData
 * @property {string} key - The key of the soure
 * @property {number[]} indexes - The indexes of the references
 */

/**
 * Generates an array of Reference objects from supplied data
 * 
 * @param {RefData[]} refData 
 * @returns {Reference[]}
 */
 export function getRefs(refData) {
    let ReferencesOptions = [];

    refData.forEach(params => {
        params.indexes.forEach(index => {
            ReferencesOptions.push({
                key: params.key,
                index: index
            })
        })
    });

    return ReferencesOptions.map(opts => new Reference(opts));
}