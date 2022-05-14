import lgEvents, {lgTopics} from '../utils/events'
import {isValidType} from "./SourceTypes";
import SourceReferencesModel from "./SourceReferencesModel";

/**
 * Model the Sources of certain type of a Quill Document.
 */
export default class DocumentSourcesModel {
    /**
     * Construct the Model
     *
     * @param {SourcesType} type
     */
    constructor (type) {
        this.errored = false;
        this.error = null;

        if (!isValidType(type)) {
            this.errored = true;
            this.error = new Error('Tipo inválido');
            lgEvents.emit('',lgTopics.ERROR, {error: this.error});
            return;
        }
        this._type = type;
        this._sources = [];
    }

    /**
     * Adds a Reference
     *
     * @param {Reference}
     * @returns {number} Source Index after updateAll.
     */
    put(Reference) {
        if(!(Reference.type === this._type)) {
            lgEvents.emit(this._type, lgTopics.ERROR, {
                error: new Error('Se trató de asignar tipo equivocado de referencia. \n ' +
                    'Referencia tipo: ' + Reference.type + ', id:'+ Reference.id + ', DocumentSourceModel tipo: ' + this._type )
            });
            return -1;
        }
        let i = this.sourceIndex(Reference.key);

        if (i > -1) {
           let firstKey = this._sources[0].key
           let isFirst = this._sources[i].put(Reference);
           // i = isFirst ? this._reLocate(i): i;
           if (isFirst) {
               i = this._reLocate(i);
               if (firstKey != Reference.key) {
                  lgEvents.emit(this._type, lgTopics.SOURCE_ORDER_CHANGE, {i:i, target:this});
               }
               lgEvents.emit(this._type, lgTopics.SOURCE_REFERENCE_ADDED_REORDERED, {reference:Reference, i:i, target: this});
           } else {
               lgEvents.emit(this._type, lgTopics.SOURCE_REFERENCE_ADDED, {reference:Reference, i:i, target:this});
           }
        } else {
            const nSM = new SourceReferencesModel(Reference.key);
            nSM.put(Reference);
            i = this._locate(nSM);
            lgEvents.emit(this._type, lgTopics.SOURCE_ORDER_CHANGE, {i:i, target:this});
            lgEvents.emit(this._type, lgTopics.SOURCE_REFERENCE_ADDED_REORDERED, {reference:Reference, i:i, target:this});
        }

        return i;
    }


    /**
     * Locate a determined source (model) in certain order in the model
     * of sources, by the index of its first element.
     *
     * @param {SourceReferencesModel} SourceModel
     * @returns {number} i - The order in wich the model was located.
     */
    _locate(SourceModel) {
        let locatingSMIndex = SourceModel.first.index;
        let i = this._sources.length;
        while (i - 1 > -1) {
            if (this._sources[i-1].first.index > locatingSMIndex) {
                i--;
            } else {
                break;
            }
        }
        this._sources.splice(i,0,SourceModel);
        // lgEvents.emit(this._type, lgTopics.SOURCE_ORDER_CHANGE, {i:i});
        return i;
    }

    /**
     * Relocate some model
     *
     * @param {number} i_SourceModel - index of the model
     * @returns {number} the index of the new (or old location
     */
    _reLocate(i_SourceModel) {

        if (this._sources.length > 1) {
            let SM = this._sources[i_SourceModel];
            this._sources.splice(i_SourceModel,1);
            return this._locate(SM);
        }

        return i_SourceModel;
    }


    /**
     * Removes a reference
     *
     * @param {Reference} Reference - The reference to be removed
     */
    remove(Reference) {
        this.removeReference(Reference.id, Reference.key)
    }

    /**
     * Removes a reference by its id and or key.
     *
     * @param {number} id - The id of the SourceBlot of the Reference
     * @param {string} key - The key of the source of the reference.
     * @returns {number} The i of the reference, or -1 if error
     * @throws {Error}
     */
    removeReference(id, key = null) {
        if (!key) {
            key = this.referenceSource(id).key;
            if (!key) {
                throw new Error('No se ha encontrado un fuente con ese id')
            }
        }
        let i = this.sourceIndex(key);
        if (i < 0) {
            lgEvents.emit(this._type, lgTopics.ERROR, {
                error: new Error('Se buscó una clave de fuente inexistente: ' + key)
            });
            return -1;
        }
        let ref = this._sources[i].get(id);
        let wasFirst = this._sources[i].remove(id);
        if (wasFirst === -1) {
            lgEvents.emit(this._type, lgTopics.ERROR, {
                error: new Error('Se buscó un id de Referencia inexistente: ' + id)
            });
            return -1;
        } else if (wasFirst) {
            if (this._sources[i].length) {
                let former_i = i;
                i = this._reLocate(i);
                lgEvents.emit(this._type, lgTopics.SOURCE_ORDER_CHANGE, {i: former_i, target:this});
            } else {
                this._sources.splice(i, 1);
                lgEvents.emit(this._type, lgTopics.SOURCE_ORDER_CHANGE, {i: i, target:this});
            }
        }
        lgEvents.emit(this._type, lgTopics.SOURCE_REFERENCE_REMOVED, {
            reference: ref, i: i, first:wasFirst, target:this});
        return i;
    }

    /**
     * The Source Type that is modeled.
     * @returns {SourcesType}
     */
    get type() {return this._type}

    /**
     * Number of diferent sources.
     * @returns {number}
     */
    get length() {return this._sources.length}

    /**
     * Get a source by its index.
     *
     * @param {number} i - the index of source
     * @returns {SourceReferencesModel}
     */
    sourceByI(i) {
        return this._sources[i];
    }

    /**
     * Gets a source by its key.
     *
     * @param {string} key - The key of the source
     * @returns {SourceReferencesModel}
     */
    source(key) {
        return this._sources.find( source => source.key === key);
    }

    /**
     * Gets a Reference
     *
     * @param {string} key - The key of the reference to get
     * @param {number} id - The id of the SourceBlot of the Reference.
     * @returns {Reference}
     */
    reference(key, id) {
        let source = this.source(key);
        if (source) {
            let ref = source.get(id);
            return  ref ? ref : false;
        } else {
            lgEvents.emit(this._type, lgTopics.ERROR, {
                error: new Error('Se buscó una clave de fuente inexistente: ' + key)
            });
            return false;
        }
    }

    /**
     * Gets the **y** index of a source.
     *
     * @param {string} key - The key of the source to gt
     * @returns {number} the index of the source model.
     */
    sourceIndex(key) {
        return this._sources.findIndex(source => source.key === key);
    }

    /**
     * Gets the ReferenceModel of a Reference by its id
     *
     * @param {number} id - The id of the source.
     * @returns {SourceReferencesModel}
     */
    referenceSource(id) {
        return  this._sources.find( source => (typeof source.get(id)) !== 'undefined');
    }
}
