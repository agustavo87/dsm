import Quill from 'quill';
import SourceBlot from '../../../quill/blots/source';

describe('SourceBlot creation.', () => {
    const key = 'a2';
    const type = 'reference';
    let container = null;
    let quill = null;
    let sbNode = {};
    let mySB = {};
    beforeAll(() => {
        container = document.createElement('div');
        container.id="quill-contaienr";
        document.body.append(container);
        
        quill = new Quill(container)
        sbNode = SourceBlot.create({key: key, type: type});
        mySB = new SourceBlot(quill.scroll, sbNode);
    });

    it('It creates the nodes with the correct dataset properties', () => {
        expect(sbNode.dataset.key).toBe(key);
        expect(sbNode.dataset.type).toBe(type);
    });

    it('Has the DOM Node established as expected', () => {
        expect(mySB.domNode).toBe(sbNode);
    });

    it('Return key and type values as expected', () => {
        expect(SourceBlot.value(sbNode)).toEqual({key:key,type:type});
    });

    it('Updates the id property of each blot as expected.', () => {
        const sbNode2 = SourceBlot.create({key: key, type: type});
        const mySB2 = new SourceBlot(quill.scroll, sbNode2);
        expect(mySB.id).toBe(0);
        expect(mySB2.id).toBe(1);
    });
});
