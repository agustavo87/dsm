import Embed from "quill/blots/embed";
import lgEvents, {lgTopics} from "../../lib/events";


class SourceBlot extends Embed {

    static create(source) {
        const node = super.create();

        node.dataset.key = source.key;
        node.dataset.type = source.type;
        node.setAttribute('contenteditable','false');

        return node;
    }

    static value(node) {
        return {
            key: node.dataset.key,
            type: node.dataset.type
        }
    }

    constructor(node) {
        super(node);
        this.mounted = false;
        this.id = ++SourceBlot.lastId;
        node.dataset.id = this.id;
    }

    attach() {
        super.attach();
        if (!this.mounted) {
            this.mounted = true;
            lgEvents.emit(this.domNode.dataset.type, lgTopics.SOURCE_EMBED_MOUNTED,{
                blot: this
            });
        }
    }

    detach() {
        this.mounted = false;
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
