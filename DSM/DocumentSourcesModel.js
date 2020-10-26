import lgEvents, {lgTopics} from '../lib/events'
import {isValidType} from "./SourceTypes";
import SourceReferencesModel from "./SourceReferencesModel";

export default class DocumentSourcesModel {

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
     *
     * @param Reference
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
           let isFirst = this._sources[i].put(Reference);
           // i = isFirst ? this._reLocate(i): i;
           if (isFirst) {
               i = this._reLocate(i);
               lgEvents.emit(this._type, lgTopics.SOURCE_ORDER_CHANGE, {i:i, target:this});
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

    _reLocate(i_SourceModel) {

        if (this._sources.length > 1) {
            let SM = this._sources[i_SourceModel];
            this._sources.splice(i_SourceModel,1);
            return this._locate(SM);
        }

        return i_SourceModel;
    }

    remove(Reference) {
        this.removeReference(Reference.id, Reference.key)
    }

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


    get type() {return this._type}

    get length() {return this._sources.length}

    sourceByI(i) {
        return this._sources[i];
    }

    source(key) {
        return this._sources.find( source => source.key === key);
    }

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

    sourceIndex(key) {
        return this._sources.findIndex(source => source.key === key);
    }

    referenceSource(id) {
        return  this._sources.find( source => (typeof source.get(id)) !== 'undefined');
    }

}
