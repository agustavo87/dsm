import Quill from 'quill/core';

/* 
import Toolbar from 'quill/modules/toolbar';
import BubbleTheme from 'quill/themes/bubble';

import Bold from 'quill/formats/bold';
import Italic from 'quill/formats/italic';
import Underline from 'quill/formats/underline';
import Link from 'quill/formats/link';

import Blockquote from 'quill/formats/blockquote';
import Header from 'quill/formats/header';
import List, {ListItem} from "quill/formats/list";

import Image from "quill/formats/image";
import Video from "quill/formats/video"; 
*/

import SourceBlot from './blots/source';

/* 
Modulos, temas y formatos de Quill
Quill.register({
    'modules/toolbar': Toolbar,
    'themes/bubble': BubbleTheme,
    'formats/bold': Bold,
    'formats/italic': Italic,
    'formats/underline': Underline,
    'formats/link': Link,
    'formats/list': List,
    'formats/list/item': ListItem,
    'formats/blockquote': Blockquote,
    'formats/header': Header,
    'formats/image': Image,
    'formats/video': Video,
});
 */

// Blot(s) específico del editor
Quill.register(SourceBlot);


export default Quill;
