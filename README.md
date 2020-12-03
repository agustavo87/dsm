# About
Model for Quill Embeds that have to be indexed and may reference to same source. 
A Module base class is also provided to implement and model blots with diferent HTML content (e.g., headers, images, tables, figures, formulas)

# Model

It makes an imaginary two dimensional matrix where:
- one dimesion *i* represents the diferentes **Sources** of a Document (DSM/DocumentSourcesModel.js)
- other dimension *j* represents the diferentes **References** in the document to the same Source. (DSM/SourceReferencesModel.js)
- Each **Reference** (DSM/Referenece.js) is an interface to a *SourceBlot* (quill/blots/source.js) in Quills document. Each SourceBlot is a Quill's interface to a HTML node.
- Each Model of Sources, model certain **SurcesTypes** (DSM/SourceTypes.js).

It keeps the *i* dimension ordered in accordance to the position of the **first** ocurrence of a Reference of such source. The first sources in appear, are ordered before the others.

# Sources Quill Modules

It is implemented as a Quill module. *Citations* is a basic module than can be easily extendended 
to make more complex types of sources (Images, Tables, Links, Headers,  anything that could be of interest in be indexed). 

The implementation of *Citation* is very basic and actually it is meant to be implemented on the quill
module configuration.

For example:

```javascript
import {SourceTypes} from 'dsm/DSM/SourceTypes';
import Quill from 'quill'

import SourceBlot from 'dsm/quill/blots/source';
import Citations from 'dsm/quill/modules/Citations'

// Blot para referencias
Quill.register(SourceBlot);
// Módulo de citaciones
Quill.register('modules/citation', Citations);



const quillOptions = {
    placeholder: 'Make something epic..',
    theme: 'bubble',
    modules: {
        citation: {
            type: SourceTypes.CITATION_DOCUMENT,
            class: 'citation',
            handlers: {
                create: function (node, data, controller) {
                    node.setAttribute('title', data.key)
                }
            }
        }
    },
}
                    
const quill = new Quill(quillContainer, quillOptions);

// Gets the module
const citations = quill.getModule('citation');

// Ads a citation to the source identified with the 'gus2020' key, 
// in the current location of the cursor
citations.put('gus2020'); 
```



