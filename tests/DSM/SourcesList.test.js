import DocumentSourcesModel from '../../DSM/DocumentSourcesModel';
import {SourceTypes} from '../../DSM/SourceTypes';
import Reference, {StaticReference, getRefs} from '../mocks/Reference';
import lgEvents, {lgTopics} from '../../utils/events.js';
import SourcesList from "../../DSM/SourcesList";
import messages from '../support/messages';
import data, {mockGet, mockSet} from '../support/data'

jest.mock('../../quill/blots/source');

describe('Source List', () => {
    /** @type {DocumentSourcesModel} */
    let myDSM;
    lgEvents.onAny(messages.save, messages);

    beforeEach(() => {
        myDSM = new DocumentSourcesModel(SourceTypes.CITATION_DOCUMENT);
        messages.clear();
        messages.save.mockClear();
        Reference.mockClear();
        StaticReference.lastId = -1;
        mockSet.mockClear();
        mockGet.mockClear();
        data._list = [];
    });

    afterEach(() => {
        lgEvents.clear(myDSM.type, lgTopics.SOURCE_ORDER_CHANGE);
        lgEvents.clear(myDSM.type, lgTopics.SOURCE_REFERENCE_REMOVED);
        lgEvents.clear(myDSM.type, lgTopics.SOURCE_REFERENCE_ADDED_REORDERED);
        lgEvents.clear(myDSM.type, lgTopics.SOURCE_REFERENCE_ADDED);
    });

    it('Without Document Sources Model throws error', () => {
        expect(() => new SourcesList()).toThrow();
    });

    it('Returns the Source type', () => {
        const mySL = new SourcesList(myDSM);
        expect(mySL.type).toBe(myDSM.type);
    });

    it('Modifying the returned list do not alter the original list', () => {
        const mySL = new SourcesList(myDSM);
        const myList = mySL.list;
        expect(mySL.list).toEqual(myList);
        // modify the list in SL.
        myList.push('something');
        expect(mySL.list).not.toEqual(myList);
    });

    it('The shadow list is updated', () => {
        const myShadowData = {};
        const mySL = new SourcesList(myDSM, myShadowData);

        let refsScenario = getRefs([
            {key: 'a5', indexes: [33, 24]},
            {key: 'a4', indexes: [40, 10, 33]}
        ]);

        refsScenario.forEach(ref => myDSM.put(ref));

        expect(mySL.list).toEqual(myShadowData.list);
    });

    it('Sotres as expected initial sources of the DSM', () => {
        getRefs([
            {key: 'a5', indexes: [33, 24]},
            {key: 'a4', indexes: [40, 10, 33]}
        ]).forEach(ref => myDSM.put(ref));

        const mySL = new SourcesList(myDSM, data);
        expect(mySL.i(0)).toBe(myDSM.sourceByI(0).key);
        expect(mySL.i(1)).toBe(myDSM.sourceByI(1).key);
        expect(data.list).toEqual([
            myDSM.sourceByI(0).key,
            myDSM.sourceByI(1).key
        ]);
    });

    it('Adds as expected to the list new sources of the DSM', () => {
        let refsScenario1 = getRefs([
            {key: 'a5', indexes: [33, 24]},
        ]);

        let refsScenario2 = getRefs([
            {key: 'a4', indexes: [40, 10, 33]}
        ]);

        refsScenario1.forEach(ref => myDSM.put(ref));
        const mySL = new SourcesList(myDSM, data);
        expect(mySL.i(0)).toBe('a5');
        expect(data.list).toEqual(['a5']);

        refsScenario2.forEach(ref => myDSM.put(ref));
        expect(mySL.i(0)).toBe('a4');
        expect(mySL.i(1)).toBe('a5');
        expect(data.list).toEqual(['a4','a5']);
    });

    it('Updates as expected after new insertions and removals.', () => {
        let refsScenario = [
            {
                key: 'a2',
                indexes: [  // Reference ID
                    5,      // 0
                    12,     // 1
                    15      // 2
                ]
            }, {
                key: 'a3',
                indexes: [
                    3,      // 3
                    19,     // 4
                    25      // 5
                ]
            }, {
                key: 'b3',
                indexes: [
                    6,      // 6
                    90      // 7
                ]
            }
        ];

        let myRefs = getRefs(refsScenario);

        myRefs.forEach(ref => myDSM.put(ref));
        const mySL = new SourcesList(myDSM, data);

        expect(myDSM.sourceIndex('a2')).toBe(1);
        expect(myDSM.sourceIndex('a3')).toBe(0);
        expect(myDSM.sourceIndex('b3')).toBe(2);

        expect(mySL.i(0)).toBe(myDSM.sourceByI(0).key);
        expect(mySL.i(1)).toBe(myDSM.sourceByI(1).key);
        expect(mySL.i(2)).toBe(myDSM.sourceByI(2).key);
        expect(data.list).toEqual([
            myDSM.sourceByI(0).key,
            myDSM.sourceByI(1).key,
            myDSM.sourceByI(2).key
        ]);

        messages.clear();
        messages.save.mockClear();
        expect(messages.save).not.toBeCalled();

        let ops = [
            {method: 'removeReference', args: [3, refsScenario[1].key]},
            {method: 'removeReference', args: [0, refsScenario[0].key]},
            {method: 'put', args: [new Reference({key: refsScenario[1].key, index: 2})]}, // id: 8
            {method: 'put', args: [new Reference({key: 'j4', index: 7})]}, // id: 9
        ];

        ops.forEach(op => myDSM[op.method](...op.args));

        expect(messages.save).toBeCalledWith(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_ORDER_CHANGE,
            expect.objectContaining({
                i: expect.any(Number)
            })
        );

        expect(myDSM.sourceIndex('a3')).toBe(0);
        expect(myDSM.sourceIndex('b3')).toBe(1);
        expect(myDSM.sourceIndex('j4')).toBe(2);
        expect(myDSM.sourceIndex('a2')).toBe(3);

        expect(mySL.i(0)).toBe(myDSM.sourceByI(0).key);
        expect(mySL.i(1)).toBe(myDSM.sourceByI(1).key);
        expect(mySL.i(2)).toBe(myDSM.sourceByI(2).key);
        expect(mySL.i(3)).toBe(myDSM.sourceByI(3).key);
        expect(data.list).toEqual([
            myDSM.sourceByI(0).key,
            myDSM.sourceByI(1).key,
            myDSM.sourceByI(2).key,
            myDSM.sourceByI(3).key
        ]);

        myDSM.removeReference(9, 'j4');

        expect(myDSM.sourceIndex('a3')).toBe(0);
        expect(myDSM.sourceIndex('b3')).toBe(1);
        expect(myDSM.sourceIndex('a2')).toBe(2);
        expect(myDSM.length).toBe(3);
        expect(mySL.length).toBe(3);
        expect(data.list.length).toBe(3);
    });
})