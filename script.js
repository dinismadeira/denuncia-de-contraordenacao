const infractionsTypeSelect = document.getElementById('infractionsType');
const infractionsSelect = document.getElementById('infractions');
const sendMail = document.getElementById('sendMail');
const localityInput = document.getElementById('locality');
const authoritySelect = document.getElementById('authority');
const textContainer = document.getElementById('textContainer');
const imageContainer = document.getElementById('images');
const fileUpload = document.getElementById("fileUpload");
const previewPDF = document.getElementById("previewPDF");
const downloadPDF = document.getElementById("downloadPDF");
const emailAddress = document.getElementById("emailAddress");
const pdfEmbed = document.getElementById("pdf");

const updateAuthorities = () => {
    authoritySelect.innerHTML = '';
    const locality = localityInput.value;
    const addOption = authority => {
        const option = document.createElement('option');
        option.innerText = authority;
        authoritySelect.appendChild(option);
    };
    for (const authority in psp) {
        if (authority.includes(locality)) addOption(authority);
    }
    if (pm[locality]) addOption("Polícia Municipal de " + locality);
    for (const authority in gnr) {
        if (authority.includes(locality)) addOption(authority);
    }
};

const updateRecipient = () => {
    const mail = psp[authoritySelect.value] || gnr[authoritySelect.value] || pm[localityInput.value];
    const subject = 'Denúncia de contraordenação ao abrigo do n.º 5 do artigo 170.º do Código da Estrada';
    const body = 'Documento assinado digitalmente anexo.';
    const href = `mailto:${mail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    sendMail.setAttribute("href", href);
    emailAddress.setAttribute("href", href);
    emailAddress.innerText = mail;
    
};

const updateInfractions = () => {
    infractionsSelect.innerHTML = '';
    for (const infraction in infractions[infractionsTypeSelect.value]) {
        const option = document.createElement('option');
        option.innerText = infraction;
        infractionsSelect.appendChild(option);
    }
};


let mustUpdatePdf = false;
const update = () => {
    updateText();
    autoUpdatePDF();
};

const autoUpdatePDF = () => {
    if (previewPDF.checked) {
        updatePDF();
        pdfEmbed.style.display = '';
    }
    else if (!mustUpdatePdf) {
        mustUpdatePdf = true;
        pdfEmbed.style.display = 'none';
    }
};

const updateText = () => {
    const fullName = sets.fullName || '<nome completo>';
    const idType = document.getElementById('idType').value;
    const residence = sets.residence || '<residência>';
    const idNumber = sets.idNumber || '0';
    const shortName = fullName.replace(/^([^ ]+).* ([^ ]+)$/, '$1 $2')
    const authority = document.getElementById('authority').value;
    const plate = (sets.plate || '00-AA-00').toUpperCase();
    const make = sets.make;
    const model = sets.model;
    const time = document.getElementById('time').value;
    const locality = document.getElementById('locality').value;
    const addressName = sets.addressName || '<endereço>';
    const addressNumber = sets.addressNumber;
    const address = addressName + ', ' + locality + (addressNumber ? ', aproximadamente junto ao número ' + addressNumber : '');
    const [year, month, day] = document.getElementById('date').value.split('-');
    const monthName = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][month - 1];
    const date = `dia ${day} de ${monthName} de ${year}`;
    const makeModelString = make && model ? ` de marca e modelo ${make} ${model}` : make ? ` de marca ${make}` : '';
    const infractionType = infractions[infractionsTypeSelect.value];
    const infraction = infractionType && infractionType[infractionsSelect.value] || ['', ''];
    const infractionDescription = infraction[0];
    const infractionArticle = ((article, nr, item) => (item ? `da alínea ${item}) ` : '') + `do n.º ${nr} do artigo ${article}.º`)(...infraction[1].split(','));
    textContainer.value = `Excelentíssimos senhores da ${authority};

Eu, ${fullName}, com o ${idType} com o número ${idNumber} e com residência em ${residence}, venho por este meio, ao abrigo do n.º 5 do artigo 170.º do Código da Estrada, fazer a seguinte denúncia de contraordenação para que a ${authority} levante o auto respetivo e multe o inframencionado responsável.

No passado ${date} pelas ${time}, na ${address}, a viatura com matrícula ${plate}${makeModelString}, ${infractionDescription}, em violação ${infractionArticle} do Código da Estrada.

Pode comprovar-se esta situação através das fotografias anexas à presente denúncia. Juro pela minha honra que a informação que consta nesta denúncia é verídica.

Com os melhores cumprimentos,
${shortName}`;
};

const PDF_TITLE = "Denúncia de contraordenação ao abrigo do n.º 5 do artigo 170.º do Código da Estrada";
const PDF_FILE_NAME = "Denuncia.pdf";

const updatePDF = () => {

    const pageWidth = 8.27,
        pageHeight = 11.69,
        lineHeight = 1.2,
        margin = 1,
        maxLineWidth = pageWidth - margin * 2,
        fontSize = 11,
        ptsPerInch = 72,
        oneLineHeight = fontSize * lineHeight / ptsPerInch,

        doc = new jsPDF({unit: 'in', lineHeight: lineHeight}).setProperties({title: PDF_TITLE});

    // splitTextToSize takes your string and turns it in to an array of strings,
    // each of which can be displayed within the specified maxLineWidth.
    const text = textContainer.value;
    const textLines = doc
        .setFont('arial', 'normal')
        .setFontSize(fontSize)
        .splitTextToSize(text, maxLineWidth);

    // doc.text can now add those lines easily; otherwise, it would have run text off the screen!
    doc.text(textLines, margin, margin);
    
    const textHeight = textLines.length * fontSize * lineHeight / ptsPerInch;
    let cursor = margin + textHeight;
    const images = imageContainer.getElementsByTagName("img");
    for (const image of images) {
        const ratio = image.naturalWidth / image.naturalHeight;
        const imageHeight = Math.min(maxLineWidth / ratio, pageHeight - 2 * margin);
        const imageWidth = imageHeight * ratio;
        if (cursor + imageHeight > pageHeight - margin) {
            doc.addPage();
            cursor = margin;
        }
        doc.addImage(image, 'JPEG', margin, cursor, imageWidth, imageHeight, image.src, 'MEDIUM', 0);
        cursor += imageHeight + oneLineHeight;
    }
    const url = `data:application/pdf;filename=${PDF_FILE_NAME};base64,` + btoa(doc.output());
    pdfEmbed.setAttribute("src", url);
    downloadPDF.setAttribute("href", url);
    downloadPDF.setAttribute("download", PDF_FILE_NAME);
    mustUpdatePdf = false;
};

for (const type in infractions) {
    const option = document.createElement('option');
    option.innerText = type;
    infractionsTypeSelect.appendChild(option);
}

const defaults = {
    date: () => {
        const today = new Date();
        return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    },
    time: () => {
        const today = new Date();
        return String(today.getHours()).padStart(2, '0') + ':' + String(today.getMinutes()).padStart(2, '0');
    },
    locality: () => 'Lisboa'
};

let sets = {};
const inputs = document.querySelectorAll("*[data-set]");
const setInputValue = (input, value) => {
    if (input.type == 'checkbox') input.checked = value && value !== 'false';
    else if (value) input.value = value;
}
const getInputValue = input => input.type == 'checkbox' ? input.checked : input.value;
const getDefault = (name, value) => value == undefined ? defaults[name] && defaults[name]() || '' : value;

infractionsTypeSelect.addEventListener('input', updateInfractions);
try {
    localStorage.getItem('test');
    for (const input of inputs) {
        const value = sets[input.id] = getDefault(input.id, localStorage.getItem(input.id));
        setInputValue(input, value);
        input.addEventListener('input', () => {
           localStorage.setItem(input.id, sets[input.id] = getInputValue(input)); 
           update();
        });
    }
} catch (e) {
    sets = window.name ? JSON.parse(window.name) : {};
    for (const input of inputs) {
        const value = getDefault(input.id, sets[input.id]);
        setInputValue(input, value);
        input.addEventListener('input', () => {
            sets[input.id] = getInputValue(input);
            window.name = JSON.stringify(sets);
            update();
        });
    }
}


updateInfractions();
updateAuthorities();
if (sets.authority) authoritySelect.value = sets.authority;
updateRecipient();
update();

localityInput.addEventListener("input", updateAuthorities);
authoritySelect.addEventListener("input", updateRecipient);
textContainer.addEventListener('input', autoUpdatePDF);

downloadPDF.addEventListener('click', () => {
    if (mustUpdatePdf) updatePDF();
});

document.getElementById("plate").addEventListener('input', e => {
    if (e.inputType == 'insertText') {
        if (/^(..(-..)?)$/.test(e.target.value)) e.target.value += '-';
        if (/--/.test(e.target.value)) e.target.value = e.target.value.replace(/--+/g, '-');
    }
});


fileUpload.addEventListener('change', e => {
    if (!e.target.files.length) return;
    const file = e.target.files[0];
    const fileReader = new FileReader();
    fileReader.onload = e => {
        const imageData = e.target.result;
        const blob = new Blob([imageData], {type: file.type});
        const image = new Image();
        image.src = URL.createObjectURL(blob);
        imageContainer.appendChild(image);
        image.setAttribute('title', 'Remover');
        image.onload = () => {
            autoUpdatePDF();
        };
        image.onclick = e => {
            e.target.parentNode.removeChild(e.target);
            autoUpdatePDF();
        };
        
    };
    fileReader.readAsArrayBuffer(file);
});
