import lgEvents, {lgTopics} from "../utils/events";
import DocumentSourcesModel from './DocumentSourcesModel';


/**
 * Just presents a list of the sources of a DocumentSourcesModel.
 */
export default class SourcesList {
    constructor(DSM, shadow = false) {
        if (!(DSM instanceof DocumentSourcesModel)) {
            throw new Error('Document Sources Model inválido: ' + DSM);
        }

        this._list = [];
        this.DSM = DSM;

        this._shadow = shadow ? shadow : {};
        this._shadow.list = [];

        this._loadDSMSoruces();
        this._update();
        lgEvents.on(DSM.type, lgTopics.SOURCE_ORDER_CHANGE, this.SourcesObserver.bind(this))
    }

    _loadDSMSoruces(from = 0) {
        for (let i = from; i < this.DSM.length; i++) {
            this._list[i] = this.DSM.sourceByI(i).key;
        }
        let dif = this._list.length - this.DSM.length;
        if (dif) {
            this._list.splice(this._list.length - dif, dif);
        }

    }

    _update() {
        // if (this._shadow) {
            this._shadow.list.splice(0);
            this.list.forEach(key => this._shadow.list.push(key))
        // }
    }

    i(i) {
        return this._list[i];
    }

    get list() {
        return [...this._list];
    }

    get length() {return this._list.length}

    get type() {
        return this.DSM.type
    }

    SourcesObserver(type, topic, data) {
        // console.log('observando',type, data, topic);
        this._loadDSMSoruces(data.i);
        this._update();
    }
}
