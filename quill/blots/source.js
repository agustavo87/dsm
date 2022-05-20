import Embed from "quill/blots/embed";
import lgEvents, {lgTopics} from "../../utils/events";

/**
 * The Quills Blot Properties
 * @typedef {object} SourceProperties
 * @property {string} key - A string to identify the source.
 * @property {SourceTypes} type - The type of source.
 */

/** Quill's Embed Blot to represent some Source*/
class SourceBlot extends Embed {
    /**
     * Create the node to be used by Quill.
     * 
     * @param {SourceProperties} source - properties
     * @returns {external:HTMLElement} the node object.
     */
    static create(source) {
        const node = super.create(source);

        node.dataset.key = source.key;
        node.dataset.type = source.type;
        node.setAttribute('contenteditable','false');

        return node;
    }

    /**
     * Returns the properties object from node
     * 
     * @param {external:HTMLElement} node
     * @returns {SourceProperties}
     */
    static value(node) {
        return {
            key: node.dataset.key,
            type: node.dataset.type
        }
    }

    constructor(scroll, node) {
        super(scroll, node);
        this.mounted = false;
        this.id = ++SourceBlot.lastId;
        node.dataset.id = this.id;
    }

    /**
     * Emits an event on blot mounting.
     * 
     * @fires SourceBlot#SOURCE_EMBED_MOUNTED
     */
    attach() {
        super.attach();
        if (!this.mounted) {
            this.mounted = true;

            /**
             * Quill had mounted the blot.
             *
             * @event SourceBlot#SOURCE_EMBED_MOUNTED
             * @type {object}
             * @property {SourceBlot} blot - The soruce blot mounted.
             */
            lgEvents.emit(this.domNode.dataset.type, lgTopics.SOURCE_EMBED_MOUNTED,{
                blot: this
            });
        }
    }

    /**
     * Emits an event on blot unmounting.
     * 
     * @fires SourceBlot#SOURCE_EMBED_UNMOUNTED
     */
    detach() {
        this.mounted = false;

        /**
         * Quill had unmounted the blot.
         *
         * @event SourceBlot#SOURCE_EMBED_UNMOUNTED
         * @type {object}
         * @property {SourceBlot} blot - The soruce blot UNmounted.
         */
        lgEvents.emit(this.domNode.dataset.type, lgTopics.SOURCE_EMBED_UNMOUNTED,{
            blot: this
        });

        super.detach()
    }
}
SourceBlot.lastId = -1;
SourceBlot.blotName = 'source';
SourceBlot.tagName = 'span';
SourceBlot.className = 'ed-source';

export default SourceBlot;
