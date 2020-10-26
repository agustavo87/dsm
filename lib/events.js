import events from 'events';

const lgTopics = {
    SOURCE_EMBED_MOUNTED: "LOGOS.SOURCE.EMBED.MOUNTED",
    SOURCE_EMBED_UNMOUNTED: "LOGOS.SOURCE.EMBED.UNMOUNTED",
    SOURCE_ORDER_CHANGE: "LOGOS.SOURCE.ORDER.CHANGE",
    SOURCE_REFERENCE_ADDED: "LOGOS.REFERENCE.ADDED",
    SOURCE_REFERENCE_ADDED_REORDERED: "LOGOS.REFERENCE.ADDED.REORDERED",
    SOURCE_REFERENCE_REMOVED: "LOGOS.REFERENCE.REMOVED",
    SOURCE_UPDATED: "LOGOS.SOURCE.UPDATED",
    SOURCE_REGISTRY_NEW: "LOGOS.SOURCE.REGISTRY.NEW",
    ERROR:"LOGOS.ERROR",
    NAMESPACE: "LOGOS"
};

/**
 * Eventos
 * Los eventos tienen un TYPE y un TOPIC
 * -> TYPE: Es el tipo de fuente de la que provienen y se definen en SourceTypes.
 * -> TOPIC: Es la razón o acontecimiento por la cual es evocado.
 *
 * Se emiten con una cadena tipo 'TOPIC/TYPE'
 * Por ej: "LOGOS.SOURCE.EMBED.MOUNTED/citation.document"
 *
 * El callback tiene una estructura
 * Callback(type, topic, data)
 * y se establece con
 * lgEvents.on(type, topic, callback).
 *
 * El emisor también
 * lgEvents.emit(type, topic, data)
 *
 * lgEvents.reset() : reinicia el manejador de eventos, y borra todos los subscriptores.
 * lgEvents.clear(type, topic): borra todos los subscriptores de un topico y tipo determinados.
 *
 * NAMESPACE: es el prependice que identifica a los eventos del editor.
 *
 * Los TOPICS son:
 *
 * SOURCE_EMBED_MOUNTED: Cuando se monta un SourceBlot
 *      data: {blot: [El SourceBlot que se ha montado]}
 *
 * SOURCE_EMBED_UNMOUNTED: Cuando se desmonta un SourceBlot
 *      data: {blot: [El SourceBlot que se ha desmontado]}
 *
 * SOURCE_REFERENCE_REMOVED: Cuando se remueve una referencia de un SourceReferencesModel
 *      data: {
 *          reference: [referencia removida],
 *          i: [index que ocupaba la Fuente a la que pertencía, o el nuevo index, si aún quedan referencias en la
 *          fuente (puede seguir siendo el mismo)],
 *          first: [si era primera: Boolean]
 *          target: [el SourceReferencesModel donde se realizó la remoción.]
 *          })
 *
 * SOURCE_REFERENCE_ADDED: Cuando se añade una referencia a una fuente YA EXISTENTE.
 * SIN crear ni cambiar el orden de fuentes. Cuando se añade referencias que cambian
 * el orden se llama a SOURCE_REFERENCE_ADDED_REORDERED.
 *      data: {
 *          reference: [la referencia añadida],
 *          i: [el orden de la fuente a la que fue añadida]
 *      }
 *
 * SOURCE_REFERENCE_ADDED_REORDERED: Cuando se añaden referencias que cambian el orden. Cuando
 * se inserta una NUEVA FUENTE o cuando se reorganiza el orden.
 *      data: {
 *          reference: [la referencia añadida],
 *          i: [el nuevo orden de la fuente a la que pertence la referencia (puede ser el mismo que el anterior)]
 *      }
 *
 * SOURCE_ORDER_CHANGE: Ocurre cuando se ha cambiado el orden de las fuentes del documento.
 * Esto normalmente ocurre en tres situaciones.
 *  - Agregar una referencia con una fuente nueva, por lo cual se inserta y reorganiza el orden. Puede
 * agregarse al final de las fuentes, y no alterar el orden de las demás pero igual se evoca el evento.
 *  - Cuando se relocaliza una fuente debido a que se añadió una referencia que tiene un orden
 *  que obliga a la moficación de su orden.
 *  - Al quitarse una fuente.
 *          data: {
 *              i: [el index al cual se movió la fuente],
 *              target: [el DSM en el cual se produjo la reorganización]
 *          }
 *
 * SOURCE_UPDATED: Ocurre cuando la información de una referencia es actualizada. Esto
 * implica que los datos de los nodos (dataset) son actualizados y es una oportunidad para ralizar
 * otras actualizaciones. En el caso de CitationsController se emite cuando cambia el orden de las
 * fuentes (SOURCE_ORDER_CHANGE).
 *      data: {
 *          references: [Un Map con las claves de las fuentes como keys, y un array de referencias que
 *          han sido actualizadas],
 *          target: [El objeto que ha realizado la actualización.]
 *      }
 *  SOURCE_REGISTRY_NEW: Ocurre cuando se registra una nueva referencia en un controlador.
 *      data {
 *          controller: [el controlador donde se registró la referencia],
 *          index: [el orden de la fuente en el Modelo de Fuentes del Documento],
 *          reference: [La referencia registrada]
 *      }
 */

class EventsManager {
        constructor() {
            this.reset();
        }

        reset() {
            this._emitter = new events.EventEmitter();
            this._anyListener = false;
        }

        emit(type, topic, data) {
            let event = topic + '/' + type;
            // let listeners = this._emitter.listeners(event);
            // console.log('emientdo: ' + event + '\n listeners: '+ this._emitter.listeners(event));
            this._emitter.emit(event,type,topic,data);

            if(this._anyListener) {
                this._emitter.emit(lgTopics.NAMESPACE,type,topic,data);
            }
        }

        on(type,topic,callback) {
                this._emitter.on(topic + '/' + type, callback);
        }

        once(type,topic,callback, binding = null) {
            if (binding) {
                this._emitter.once(topic + '/' + type, callback.bind(binding));
            } else {
                this._emitter.once(topic + '/' + type, callback);
            }
        }

        clear(type, topic) {
            this._emitter.removeAllListeners(topic + '/' + type)
        }

        onAny(callback, binding) {
            if (binding) {
                this._emitter.on(lgTopics.NAMESPACE, callback.bind(binding));
            } else {
                this._emitter.on(lgTopics.NAMESPACE, callback);
            }
            this._anyListener = true;
        }
}

const lgEvents = new EventsManager();

export {lgEvents as default, lgTopics};
