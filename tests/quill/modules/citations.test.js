import Citations from '../../../quill/modules/Citations'
import Quill from '../../../quill/quill';
import SourceBlot from '../../../quill/blots/source';
import Reference from '../../../DSM/Reference';
import {SourceTypes} from '../../../DSM/SourceTypes';
import lgEvents, {lgTopics} from "../../../utils/events";
import {queryProxy as $, queryProxyAll as $$} from "../../../utils/functions";
import SourceReferencesModel from '../../../DSM/SourceReferencesModel';



it('is called by Quill', () => {
    const CitationsMock = jest.createMockFromModule('../../../quill/modules/Citations').default;
   
    Quill.register('modules/citation', CitationsMock);
    let container = document.createElement('DIV');
    let quill = new Quill(container, {
        modules: {
            citation: {}
        }
    });
    expect(CitationsMock).toBeCalled();
});

describe ('Custom citation', () => {
    let quill = null;
    let container = null;
    let modCitations = null;

    beforeAll(() => {
        Quill.register('modules/citation', Citations);
        document.body.innerHTML = '<div id="editor"></div>';
        container = document.getElementById('editor');
    });

    beforeEach(() => {
        // console.log('......INICIANDO......');
    });

    afterEach(() => {
        // console.log('......LIMPIANDO......');
        lgEvents.reset();
        modCitations.reset();
        quill.setContents();
        SourceBlot.lastId = -1;
    });

    it('is created and updated as specified by module configuration', () => {
        // mock info of a post
        const postID = '1041';

        // mock info from a mock source provider
        const mockUpdate = jest.fn();
        const mockGet = jest.fn(function (key) {
            return {
                author: {
                    firstName: 'Gustavo Raúl',
                    lastName: 'Ayala'
                },
                year: '2005',
                title: 'Más allá de acá y por ahí.'
            }
        });

        // Mock source provider
        const mockSP = {
            get: mockGet,
            update: mockUpdate
        };

        /**
         *  data{key, n, i[source index]}
         *  node [citation node]
         *  controller [source controller -citation]
         */
        quill = new Quill(container, {
            modules: {
                citation: {
                    type: SourceTypes.CITATION_DOCUMENT,
                    class: 'citation',
                    handlers: {
                        create: function (node, data, controller) {
                            let source = mockSP.get(data.key);
                            node.innerHTML = '(' + (data.i !== null ? data.i + 1: '') + ': ' +
                                source.author.lastName + ' ' +
                                source.year + ')';
                            node.setAttribute('title', source.title);
                            mockSP.update({ // just a mock binding.
                                bind: {
                                    key: data.key,
                                    source: postID
                                }
                            })
                        },
                        update: function (node, data, controller) {
                            let source = mockSP.get(data.key);
                            node.innerHTML = '('+  (data.i + 1) + ': ' +
                                source.author.lastName + ' ' +
                                source.year + ')';
                        },
                        remove: function (node, data, controller){
                            mockSP.update({
                                unbind: {
                                    key: data.key,
                                    source: postID
                                }
                            })
                        }

                    }
                }
            }
        });

        modCitations = quill.getModule('citation');

        const key = 'a2';
        modCitations.put(key);

        let citationNode = $('span.' + SourceBlot.className + ' span.' + modCitations.class, container);

        let source = mockSP.get(key);
        let expectedText = '(1: ' +
            source.author.lastName + ' ' +
            source.year + ')';

        expect(citationNode.innerHTML).toMatch(expectedText);
        expect(citationNode.getAttribute('title')).toMatch(source.title);

        // console.log('RESULTADO: \n', quill.scroll.domNode.innerHTML);
        expect(mockUpdate).toBeCalled();

        mockUpdate.mockClear();
        let ref = modCitations.source(key).first;
        // console.log(quill.scroll.domNode.innerHTML);

        expect(mockUpdate).not.toBeCalled();
        quill.deleteText(ref.index, 1);

        // console.log('POS-BORRADO: \n', quill.scroll.domNode.innerHTML);
        expect(mockUpdate).toBeCalled();
    });
});

describe ('Module operations', () => {
    let quill = null;
    let container = null;
    let modCitations = null;

    beforeAll(() => {
        Quill.register('modules/citation', Citations);
        // document.body.innerHTML = '<div id="editor"></div>';
        // container = document.getElementById('editor');
    });

    beforeEach(() => {
        // console.log('......INICIANDO......');
        quill = null;
        document.body.innerHTML = '<div id="editor"></div>';
        container = document.getElementById('editor');
        quill = new Quill(container, {
            modules: {
                citation: {
                    type: SourceTypes.CITATION_DOCUMENT,
                    class: 'citation'
                }
            }
        });
        modCitations = quill.getModule('citation');
    });

    afterEach(() => {
        // console.log('......LIMPIANDO......');
        lgEvents.reset();
        modCitations.reset();
        quill.setContents();
        SourceBlot.lastId = -1;

    });

    it('put method is called by quill', () => {
        let spy = jest.spyOn(modCitations, 'put');
        modCitations.put('a2');
        expect(spy).toBeCalled();
        spy.mockRestore();
    });

    it('Calls Reference Render Callbacks as expected', () => {
        let key='gus2020'
        if (!modCitations.options.handlers) modCitations.options['handlers'] = {};

        modCitations.options.handlers.create = (node, data, controller) => {
            expect(node).toBeInstanceOf(HTMLElement)
            expect(data).toMatchObject({
                i: null,
                id: expect.any(Number),
                key: key
            })
            expect(controller).toBeInstanceOf(Citations)
        }

        modCitations.options.handlers.update = (node, data, controller) => {
            expect(node).toBeInstanceOf(HTMLElement)
            expect(data).toMatchObject({
                i: expect.any(Number),
                id: expect.any(Number),
                key: key
            })
            expect(controller).toBeInstanceOf(Citations)
        }

        modCitations.options.handlers.remove = (node, data, controller) => {
            expect(node).toBeInstanceOf(HTMLElement)
            expect(data).toMatchObject({
                i: expect.any(Number),
                id: expect.any(Number),
                key: key
            })
            expect(controller).toBeInstanceOf(Citations)
        }

        modCitations.put(key);
        let ref = modCitations.source(key).getByJ(0);
        // console.log(ref.index);
        // console.log(quill.scroll.domNode.innerHTML);
        quill.deleteText(ref.index, 1);
        // console.log(quill.scroll.domNode.innerHTML);
    })

    it('keeps a shadow list of sources', () => {
        const key = 'a2';
        modCitations.put(key);

        expect(modCitations.data.list).toEqual(modCitations.SList.list);
        expect(modCitations.data.list).not.toBe(modCitations.SList.list);
        expect(modCitations.data.list).toEqual([key]);
    });



    it('emits events on new and update reference/s', done => {
        const sourceKey = 'a3';

        function registrado(type, topic, data) {
            try {
                // console.log('Registrado', type, topic, data.index);
                expect(data.index).toBe(0);
                expect(data.controller).toBe(modCitations);
                expect(data.reference).toBeInstanceOf(Reference);
                done();
            } catch (e) {
                done(e);
            }
        }

        lgEvents.on(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_REGISTRY_NEW,
            registrado
        );

        lgEvents.on(
            modCitations.type,
            lgTopics.SOURCE_UPDATED,
            (type, topic, data) => {
                expect(data.references.get('a3')[0]).toBeInstanceOf(Reference);
                expect(data.target).toBe(modCitations);
            }
        );

        modCitations.put(sourceKey);

    });



    it('inserts a reference', done => {
        const sourceKey = 'a3';
        const sourceDelta = {
            insert: {
                'source': {
                    key: sourceKey,
                    type: modCitations.type
                }
            }
        };

        lgEvents.on(
            modCitations.type,
            lgTopics.SOURCE_REGISTRY_NEW,
            (type, topic, data) => {
                try {
                    let SNode = $('.' + SourceBlot.className, container);
                    let CNode = $('.' + modCitations.class, SNode);
                    // console.log('Source: Node: %s, \n ' +
                    //     'Content Node: %s. \n', SNode.outerHTML, CNode.outerHTML);
                    expect(SNode).toBeInstanceOf(HTMLElement);
                    expect(SNode.classList.contains(SourceBlot.className)).toBe(true);
                    expect(SNode.dataset.key).toBe(sourceKey);
                    expect(SNode.dataset.type).toBe(modCitations.type);
                    expect(Number(SNode.dataset.id)).toBe(data.reference.id);
                    expect(Number(CNode.dataset.n)).toBe(data.index + 1);
                    let ref = modCitations.ref(data.reference.id);
                    expect(ref).toBeInstanceOf(Reference);
                    expect(ref).toBe(data.reference);
                    done();
                } catch (e) {
                    done(e)
                }

            }
        );

        const delta = modCitations.put(sourceKey);
        // console.log(delta.ops[0]);
        expect(delta.ops[0]).toMatchObject(sourceDelta);
        // console.log(delta);
        // console.log(JSON.stringify(quill.getContents().ops[0]));
        // expect(quill.getContents().ops[0]).toEqual(expect.objectContaining(sourceDelta));
        expect(quill.getContents().ops[0]).toMatchObject(sourceDelta);
    });


    it('register a source as expected', done => {

        lgEvents.on(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_REGISTRY_NEW,
            registrado
        );
        function registrado(type, topic, data) {
            try {
                // console.log('Registrado', type, topic, data.index);
                expect(data.index).toBe(0); // index (order) de fuente.
                // se actualiza lista de fuentes.
                // console.log(modCitations.data.list);
                // console.log(modCitations.SList);
                expect(modCitations.data.list).toMatchObject([key]);
                expect(modCitations.data.list[data.index]).toBe(key);

                // Chaining
                // console.log('modCitations.source(key): ', modCitations.source(key));
                expect(modCitations.source(key)).toBeInstanceOf(SourceReferencesModel);

                let id = modCitations.source(key).first.id;

                // console.log('modCitations.source(key).get(' + id + '): ', modCitations.source(key).get(id));
                expect(modCitations.source(key).get(id)).toBeInstanceOf(Reference);
                // console.log('modCitations.source(key).get(' + id + ').index: ', modCitations.source(key).get(id).index);
                expect(modCitations.source(key).get(id).index).toEqual(expect.any(Number));
                // console.log('modCitations.source(key).get(' + id + ').blot: ', modCitations.source(key).get(id).blot);
                expect(modCitations.source(key).get(id).blot).toBeInstanceOf(SourceBlot);

                done();
            } catch (e) {
                done(e);
            }
        }

        const key = 'a3';

        modCitations.put(key);

    });


    it('mount the source node in the DOM as expected', done => {

        const key = 'a3';

        lgEvents.on(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_REGISTRY_NEW,
            function (type, topic, data) {
                try {
                    let sBlot = modCitations.source(key).first.blot;
                    // console.log(sBlot.domNode.outerHTML);
                    let qNode = $('span[data-key="' + key + '"]');
                    // console.log(qNode.outerHTML);
                    expect(sBlot.domNode).toBe(qNode);
                    done();
                } catch (e) {
                    done(e);
                }
            }
        );

        modCitations.put(key);
    });



    it('makes the citation node with expected attributes', done => {
        // console.log(':::::Formatea adecuadamente la cita::::::');
        const key = 'a3';

        function checkFormat(type, topic, data) {
            try {
                let contentNode = modCitations.source(key).first.blot.contentNode;
                // console.log(contentNode.outerHTML);
                let citationNode = $('span[data-key="' + key + '"] .' + modCitations.class ,container);
                // console.log(citationNode.outerHTML);
                expect(contentNode).toBe(citationNode);
                done();
            } catch (e) {
                done(e);
            }
        }

        lgEvents.on(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_REGISTRY_NEW,
            checkFormat
        );

        modCitations.put(key);
    });

        

    it('numbers accordingly the citation', done => {
        // console.log('::::::Numera adecuadamente la cita:::::::::');
        const key = 'a3';

        lgEvents.on(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_UPDATED,
            checkCorrespondence.bind(this, done, {key:key})
        );

        modCitations.put(key);
    });

        
    it('increases the citation number', done => {
        // console.log('......AUMENTAR NUMERACION........');

        const keys = ['a3', 'a4'];


        lgEvents.on(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_UPDATED,
            checkCorrespondence.bind(this, done, {keys:keys})
        );

        keys.forEach(key => modCitations.put(key));

    });

    

    it('removes the citation as expected', done => {

        const key = 'a3';

        lgEvents.on(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_REFERENCE_REMOVED,
            checkSourceLength.bind(this, done, {key:key})
        );

        modCitations.put(key);
        modCitations.put(key);
        // console.log(Citations.source(key).length);
        // console.log(Citations.source(key).list);

        let ref = modCitations.source(key).getByJ(1);
        // console.log(quill.scroll.domNode.innerHTML);
        quill.deleteText(ref.index, 1);
        // console.log(quill.scroll.domNode.innerHTML);
        // console.log(Citations.source(key).length);
        // console.log(Citations.source(key).list);
    });

    

    it('reorders the numeration', done => {
        // console.log('......REORGANIZAR NUMERACIÓN................');

        const testData = {
            keysSets: [
                [
                    {index: -1, key: 'a2'},
                    {index: -1, key: 'a3'},
                    {index: 0, key: 'a3'}
                ],
                [
                    {index: 0, key: 'a2'}
                ]
            ],
            finalExpectedOrder: [
                {key: 'a2', n: 1},
                {key: 'a3', n: 2},
                {key: 'a2', n: 1},
                {key: 'a3', n: 2},
            ]
        };


        lgEvents.on(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_UPDATED,
            checkCorrespondence.bind(this, done, testData)
        );

        testData.keysSets[0].forEach(ref => modCitations.put(ref.key, ref.index));

        lgEvents.on(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_UPDATED,
            checkExpectedOrder.bind(this, done, testData)
        );

        let lastRef = testData.keysSets[1][0];
        modCitations.put(lastRef.key, lastRef.index);

    });

    

    it('reorders the numeration on delete', done => {
        // console.log('......REORGANIZAR NUMERACIÓN................');

        const testData = {
            keysSets: [
                [
                    {index: -1, key: 'a2'},
                    {index: -1, key: 'a3'},
                    {index: 0, key: 'a3'},
                    {index: 0, key: 'a2'}
                ]
            ],
            finalExpectedOrder: [
                // {key: 'a2', n: 1},
                {key: 'a3', n: 1},
                {key: 'a2', n: 2},
                {key: 'a3', n: 1},
            ]
        };


        lgEvents.on(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_UPDATED,
            checkCorrespondence.bind(this, done, testData)
        );

        testData.keysSets[0].forEach(ref => modCitations.put(ref.key, ref.index));

        lgEvents.on(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_UPDATED,
            checkExpectedOrder.bind(this, done, testData)
        );

        let firstRefNode = $('.' + SourceBlot.className, quill.scroll.domNode);
        let firstRef = modCitations.ref(firstRefNode.dataset.id);
        expect(firstRef).toBeInstanceOf(Reference);
        quill.deleteText(firstRef.index, 1);
    });

    

    it('reorders the numeration on masive deletion', done => {
        // console.log('......REORGANIZAR Con borrado conjunto................');

        const testData = {
            keysSets: [
                [
                    {index: -1, key: 'a2'},
                    {index: -1, key: 'a3'},
                    {index: -1, key: 'a3'},
                    {index: 0, key: 'a3'},
                    {index: 0, key: 'a2'}
                ]
            ],
            finalExpectedOrder: []
        };

        lgEvents.on(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_UPDATED,
            checkCorrespondence.bind(this, done, testData)
        );

        testData.keysSets[0].forEach(ref => modCitations.put(ref.key, ref.index));


        let content = quill.scroll.domNode;
        let refNodes = $$('.' + SourceBlot.className, content);
        let firstRef = modCitations.ref(refNodes[0].dataset.id);
        let thirdRef = modCitations.ref(refNodes[2].dataset.id);

        // console.log('POR BORRAR: \n', content.innerHTML);
        quill.deleteText(firstRef.index,(thirdRef.index - firstRef.index) + 1);
        // console.log(content.innerHTML);
    });


    function checkCorrespondence(done, testData, type, topic, data) {
        // Chequea que el N° mostrado corresponde con el orden registrado en el DSM.
        try {
            // console.log('\t|---> chequeo de correspondencia de N° de citación\n' +
            //     '\tevento: ' + topic + '/' + type + '.\n' + '\tSources: ' + data.references.size);

            // console.log('testdata:', Object.keys(testData));

            let content = quill.scroll.domNode;
            let sources = $$('.' + SourceBlot.className, content);
            // console.log('content: \n %s \n\n sources:\n %o', content.innerHTML,
            //     Array.from(sources.values()).map(n => n.outerHTML));
            // console.log('SOURCE NODES: ', sources.length);
            let i, node, key, refID, citN, modelN;
            for ([i, node] of sources.entries()) {
                key = node.dataset.key;
                refID = node.dataset.id;
                citN = $('.' + modCitations.class, node).dataset.n;
                modelN = modCitations.i(key) + 1;
                // console.log('i\tkey\tid\tn°\tmodelN\n' +
                //     '%s\t%s\t%s\t%s\t%s', i, key, refID, citN, modelN);

                expect(Number(citN)).toBe(modelN);
            }

            done();
        } catch (e) {
            done(e);
        }
    }

    function checkSourceLength(done, testData, type, topic, data) {
        try {
            // console.log('......TEST: REMOCION DE CITAN::chequeo de nodos........ \n' +
            //     'evento: ' + topic + '/' + type + '.\n', data);

            let key = data.reference.key;

            let citationNodes = $$('span[data-key="' + key + '"] .' + modCitations.class, container);
            // console.log("citationNodes.length:", citationNodes.length);
            // console.log("citationNodes.values:", Array.from(citationNodes.values()));

            // expect(citationNodes.length).toBe(1);
            expect(citationNodes.length).toBe(modCitations.source(key).length);

            // console.log(citationNodes.length);

            done();
        } catch (e) {
            done(e);
        }
    }

    function checkExpectedOrder(done, testData, type, topic, data) {
        // Chequea que el N° mostrado corresponde con el orden registrado en el DSM.
        try {
            // console.log('\t|---> chequeo de orden esperado\n' +
            //     'evento: ' + topic + '/' + type + '.\n' + 'Refs: ' + data.references.size);

            // console.log('testdata:', Object.keys(testData));

            let content = quill.scroll.domNode;
            let sources = $$('.' + SourceBlot.className, content);
            // console.log('content: \n %s \n\n sources:\n %o', content.innerHTML,
            //     Array.from(sources.values()).map(n => n.outerHTML));
            let i, node, key, refID, citN,
                expKey, expN;
            for ([i, node] of sources.entries()) {
                key = node.dataset.key;
                refID = Number(node.dataset.id);
                citN = Number($('.' + modCitations.class, node).dataset.n);

                expKey = testData.finalExpectedOrder[i].key;
                expN = testData.finalExpectedOrder[i].n;


                // console.log('status\ti\tkey\tid\tn°\n' +
                //     'Found\t%s\t%s\t%s\t%s\n' +
                //     'Exp.\t \t%s\t \t%s',
                //     i, key, refID, citN, expKey, expN);

                expect(key).toBe(expKey);
                expect(citN).toBe(expN);
            }


            done();
        } catch (e) {
            done(e);
        }
    }
});



describe('Citations extension', () => {

    it('can be extended', () => {
        class Imagen extends Citations {}
        Imagen.class = 'logos-image';
        SourceTypes['IMAGEN'] = 'document.image';
        Imagen.type = SourceTypes.IMAGEN;

        Quill.register('modules/image', Imagen);
        document.body.innerHTML = '<div id="editor"></div>';
        let container = document.getElementById('editor');
        

        let quill = new Quill(container, {
            modules: {
                image: {}
            }
        });

        let modImages = quill.getModule('image');
        const key = 'gato'
        modImages.put(key);
        expect(true).toBe(true);
        // console.log(container.innerHTML);
        let sourceNode = $('.' + SourceBlot.className, container);
        let citationNode = $('.' + modImages.class, sourceNode);

        // console.log(sourceNode.outerHTML);
        // console.log(citationNode.outerHTML);

        expect(sourceNode.dataset.type).toBe(Imagen.type);
        expect(citationNode.classList.contains(Imagen.class)).toBe(true);
        expect(Number(citationNode.dataset.n)).toBe(modImages.i(key) + 1);
        
    });


});

