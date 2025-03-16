const {readFileSync} = require('fs');
const { join } = require('path');
const document = readFileSync(join(__dirname, `./${Editor.I18n.getLanguage() === 'en' ? 'doc-en' : 'doc-zh'}.html`), 'utf8');
exports.template = `<div class="document">${document}
    <div class="btns">
        <ui-button class="disagree"></ui-button>
        <ui-button class="agree"></ui-button>
    </div>
</div>`;
exports.style = `
h1 {
    text-align: center;
}
.document {
    overflow: auto;
    width: 100%;
    height: 100%;
    padding: 10px 10px 40px 20px;
    box-sizing: border-box;
}
.btns {
    display: flex;
    justify-content: center;
    position: fixed;
    bottom: 5px;
    left: 0;
    right: 0;
}
.btns ui-button {
    box-shadow: 0 0 3px #ddd;
}
.btns ui-button + ui-button {
    margin-left: 30px;
}
`;

exports.$ = {
    disagree: '.disagree',
    agree: '.agree',
};

exports.methods = {
    async agree(v) {
        await Editor.Profile.setConfig('xr-plugin', 'document.agree', v, 'global');
        Editor.Message.send('xr-plugin', 'agree', v);
        await Editor.Panel.close('xr-plugin');
    },
};

exports.beforeClose = async function() {
    const isAgree = await Editor.Profile.getConfig('xr-plugin', 'document.agree', 'global');
    return exports.methods.agree(Boolean(isAgree));
};

exports.ready = function() {
    this.$.agree.innerText = Editor.I18n.t('xr-plugin.document.agree');
    this.$.disagree.innerText = Editor.I18n.t('xr-plugin.document.disagree');
    
    this.$.agree.addEventListener('click', () => {
        exports.methods.agree(true);
    });

    this.$.disagree.addEventListener('click', () => {
        exports.methods.agree(false);
    });
};