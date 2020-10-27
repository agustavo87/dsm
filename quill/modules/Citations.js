import {SourceTypes} from "../../DSM/SourceTypes";
import Quill from 'quill';
import DocumentSourcesModel from "../../DSM/DocumentSourcesModel";
import SourcesList from "../../DSM/SourcesList";
import lgEvents, {lgTopics} from '../../utils/events'
import Reference from "../../DSM/Reference";
import hasIn from 'lodash/hasIn';

export default class Citations {
    constructor(quill, options) {

        this.options = options;
        this.quill = quill;
        Reference.quill = quill;
        this._type = options.type ? options.type : SourceTypes.CITATION_DOCUMENT;
        this._class = options.class ? options.class : 'citation';
        this._DSM = new DocumentSourcesModel(this._type);
        this.data = {};
        this.SList = new SourcesList(this._DSM, this.data);
        this.bindEvents();
        // console.log('Citations Construido:', quill.container.id, options);
    }

    get type() {
        return this._type;
    }

    get class() {
        return this._class;
    }

    bindEvents() {
        lgEvents.on(this._type, lgTopics.SOURCE_EMBED_MOUNTED, this.register.bind(this));
        lgEvents.on(this._type, lgTopics.SOURCE_EMBED_UNMOUNTED, this.unregister.bind(this));
        lgEvents.on(this._type, lgTopics.SOURCE_REFERENCE_ADDED, this.update.bind(this));
        lgEvents.on(this._type, lgTopics.SOURCE_ORDER_CHANGE, this.updateAll.bind(this));
    }

    config(options) {
        if (options.quill !== 'undefined' && options.quill instanceof Quill) {
            this.quill = options.quill;
            this.bindEvents();
            this._ready = true;
            return true;
        } else {
            throw  new Error('Instancia incorrecta de Quill');
        }
    }

    // todo:chequear si lo llaman de otros lados.
    // create(SourceBlot) {
    //     let span = SourceBlot.contentNode;
    //     span.classList.add(this._class);
    //     span.dataset.n = '';
    //     if(hasIn(this.options, 'handlers.create')) {
    //         this.options.handlers.create(
    //             span,
    //             {
    //                 i:null,
    //                 key:SourceBlot.domNode.dataset.key
    //             },
    //             this
    //         );
    //     }
    // }

    register(type, topic, data) {
        if (this.quill.scroll !== data.blot.scroll) {
            // console.warn('[Citation.register]: llamada desde una instancia distinta de quill.');
            lgEvents.emit(this.type, lgTopics.ERROR,
                {msg: 'Citations.register: llamada desde una instancia distinta de quill.', target:this});
            return false;
        }

        let ref = new Reference(data.blot, this.quill);

        Citations.handlers.create(
            ref.blot.contentNode,
            {
                i:null,
                key:ref.key
            },
            this
        );

        if(hasIn(this.options, 'handlers.create')) {
            this.options.handlers.create(
                ref.blot.contentNode,
                {
                    i:null,
                    key:ref.key
                },
                this
            );
        }

        // this.create(ref.blot); // todo:chequear si lo llaman de otros lados.
        let i = this._DSM.put(ref);




        lgEvents.emit(
            this._type,
            lgTopics.SOURCE_REGISTRY_NEW,
            {
                controller: this,
                index: i,
                reference: ref
            }
        );
        return true;
    }

    unregister(type, topic, data) {
        // console.log('desregistrado blot id°', data.blot.id);
        let id = data.blot.id,
            key = data.blot.domNode.dataset.key;

        let i = this._DSM.removeReference(id, key);

        Citations.handlers.remove(
            data.blot.contentNode,
            {
                i: i,
                key: key,
                id: id
            },
            this
        );

        if (hasIn(this.options, 'handlers.remove')) {
            this.options.handlers.remove(
                data.blot.contentNode,
                {
                    i: i,
                    key: key,
                    id: id
                },
                this
            );
        }

        return i;
    }

    updateAll(type, topic, data) {
        let refsUpdated = new Map;

        for (let i = data.i; i < this._DSM.length; i++) {
            let source = this._DSM.sourceByI(i);
            refsUpdated.set(source.key, []);
            source.list.forEach(ref => {
                    Citations.handlers.update(
                        ref.blot.contentNode,
                        {
                            i: i,
                            key: ref.key
                        },
                        this
                    );

                    if (hasIn(this.options, 'handlers.update')) {
                        this.options.handlers.update(
                            ref.blot.contentNode,
                            {
                                i: i,
                                key: ref.key
                            },
                            this
                        );
                    }

                    // console.log('[updateAll] actualizando fuente ' + ref.key + ', n: ' + (i + 1),
                    //     ref.blot.contentNode.outerHTML);
                    refsUpdated.get(source.key).push(ref);
                }
            )
        }
        // console.log('[updateAll] Emitiendo SourceUpdated Listeners:', lgEvents._emitter.listeners(lgTopics.SOURCE_UPDATED + '/' + this._type));
        lgEvents.emit(this._type, lgTopics.SOURCE_UPDATED, {references: refsUpdated, target: this});
    }

    update(type, topic, data) {
        let i = this._DSM.sourceIndex(data.reference.key);
        Citations.handlers.update(
            data.reference.blot.contentNode,
            {
                i: i,
                key: data.reference.key
            },
            this
        );

        if (hasIn(this.options, 'handlers.update')) {
            this.options.handlers.update(
                data.reference.blot.contentNode,
                {
                    i: i,
                    key: data.reference.key
                },
                this
            );
        }
        // console.log('[update] actualizando fuente ' + data.reference.key +
        //     ', n=' + (i + 1));

        // console.log('[update] Emitiendo SourceUpdated Listeners:', lgEvents._emitter.listeners(lgTopics.SOURCE_UPDATED + '/' + this._type));
        let ref = new Map();
        ref.set(data.reference.key, [data.reference]);
        lgEvents.emit(this._type, lgTopics.SOURCE_UPDATED, {references: ref, target: this});
    }

    put(sourceKey, index = -1) {
        if(index < 0) {index = this.quill.getSelection(true).index}

        let delta = this.quill.insertEmbed(index, 'source', {key: sourceKey, type: this._type}, Quill.sources.USER);
        this.quill.insertText(index + 1, ' ', Quill.sources.USER);
        this.quill.setSelection(index + 1, 0, Quill.sources.USER);
        return delta;
    }

    reset() {
        lgEvents.clear(this._type, lgTopics.SOURCE_EMBED_MOUNTED);
        lgEvents.clear(this._type, lgTopics.SOURCE_EMBED_UNMOUNTED);
        lgEvents.clear(this._type, lgTopics.SOURCE_ORDER_CHANGE);
        lgEvents.clear(this._type, lgTopics.SOURCE_REFERENCE_ADDED);
        lgEvents.clear(this._type, lgTopics.SOURCE_REFERENCE_ADDED_REORDERED);

        this._DSM = new DocumentSourcesModel(this._type);
        this.SList = new SourcesList(this._DSM, this);
        // this.provider = new SourcesProvider(testSources);
        // this._ready = false;
    }

    source(key) {
        return this._DSM.source(key);
    }

    sourceByI(i) {
        return this._DSM.sourceByI(i);
    }

    i(key) {
        return this._DSM.sourceIndex(key)
    }

    sourceByID(id) {
        return this._DSM.referenceSource(id)
    }

    ref(id) {
        // it's not optimum
        id = Number(id);
        return this._DSM.referenceSource(id).get(id);
    }

    get length() {
        return this._DSM.length;
    }
}

const defaultHandlers =  {
    create: function (node, data, controller) {
        node.classList.add(controller.class);
        node.dataset.n = (data.i !== null  ? data.i + 1 : '');
    },
    update: function (node, data, controller) {
        node.dataset.n = data.i + 1;
    },
    remove: () => {}
};

Citations.handlers = defaultHandlers;