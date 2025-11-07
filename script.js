/// TEXTO PARA FALA (TTS - Text-To-Speech)

// Objetos - Html Elementos
const selectIdioma = document.getElementById("selectIdioma")
const selectVoz = document.getElementById("selectVoz");
const txtTexto = document.getElementById("txtTexto");
const btnReproduzir = document.getElementById("btnReproduzir");
const btnParar = document.getElementById("btnParar");
const rangePitch = document.getElementById("rangePitch");
const pitchValue = document.getElementById("pitchValue");
const rangeRate = document.getElementById("rangeRate");
const rangeValue = document.getElementById("rangeValue");

const synth = window.speechSynthesis;
let vozes = [];

let fala = new SpeechSynthesisUtterance("");

// eventos
selectIdioma.addEventListener('change', (evento) => {
    const novoIdioma = evento.target.value;
    popularCampos(novoIdioma);
});

rangePitch.addEventListener('input', () => {
    pitchValue.textContent = parseFloat(rangePitch.value).toFixed(0);
});

rangeRate.addEventListener('input', () => {
    rateValue.textContent = parseFloat(rangeRate.value).toFixed(1);
});

btnReproduzir.addEventListener('click', () => {
    const texto = txtTexto.value || '';
    if (!texto || texto.length === 0) {
        alert('Texto não informado');
        txtTexto.focus();
        return;
    }

    const pitch = rangePitch.value || 1;
    const rate = rangeRate.value || 1;

    fala = new SpeechSynthesisUtterance(texto);
    fala.voice = obterVozSelecionada();
    fala.pitch = pitch; // entre 0 e 2 (frequencia da fala)
    fala.rate = rate; // entre 0.1 e 10 (velocidade da fala)
    
    fala.addEventListener('start', () => {
        definirEstadoBotoes(true);
    });

    fala.addEventListener('end', () => {
        definirEstadoBotoes(false);
    });

    fala.addEventListener('error', () => {
        definirEstadoBotoes(false);
    });

    fala.addEventListener('pause', () => {
        definirEstadoBotoes(false);
    });

    fala.addEventListener('resume', () => {
        definirEstadoBotoes(true);
    });


    synth.cancel();
    synth.speak(fala);
    

    txtTexto.select()
    txtTexto.focus();
});

btnParar.addEventListener('click', () => {
    synth.pause();
    synth.cancel();
    btnReproduzir.disabled = false;
    btnParar.disabled = true;
});

const obterVozSelecionada = () => {
    const nomeDaVozSelecionada = selectVoz.selectedOptions[0].getAttribute('data-nome') || 'Google português do Brasil';
    const vozSelecionada = vozes.find(v => v.name.includes(nomeDaVozSelecionada));
    return vozSelecionada;
}

const definirEstadoBotoes = (reproduzindo) => {
    btnReproduzir.disabled = reproduzindo;
    btnParar.disabled = !reproduzindo;
}


const popularCampos = (idiomaSelecionado = '') => {
    vozes = synth.getVoices(); 

    // remove todos os childs
    selectIdioma.innerHTML = '<option value="" selected>Exibir Todos</option>';
    selectVoz.innerHTML = '<option value="">Selecione a Voz</option>';

    const todosIdiomas = vozes.map(voz => voz.lang);
    const idiomas = Array.from(new Set(todosIdiomas)).sort(); //faz um distinto dos valores

    for (let i = 0; i < idiomas.length; i++)
    {
        const idiomaAtual = idiomas[i];
        let novaOpcao = document.createElement("option");
        novaOpcao.textContent = idiomaAtual;

        if (idiomaSelecionado.toLocaleLowerCase() === idiomaAtual.toLocaleLowerCase()) {
            novaOpcao.selected = true;
        }

        novaOpcao.setAttribute("data-idioma", idiomaAtual);
        selectIdioma.appendChild(novaOpcao);
    }

    let vozesNoIdioma = vozes.filter((voz) => voz.lang.toLocaleLowerCase() === idiomaSelecionado.toLocaleLowerCase());
    if (vozesNoIdioma.length === 0) {
        vozesNoIdioma = vozes;
    }
    for (let i = 0; i < vozesNoIdioma.length; i++)
    {
        const vozAtual = vozesNoIdioma[i];
        let novaOpcao = document.createElement("option");
        novaOpcao.textContent = vozAtual.name + "(" + vozAtual.lang + ")";

        novaOpcao.setAttribute("data-idioma", vozAtual.lang);
        novaOpcao.setAttribute("data-nome", vozAtual.name);
        selectVoz.appendChild(novaOpcao);
    }
}

setTimeout(() => {
    popularCampos();
}, 100);



/// RECONHECIMENTO DA FALA (STT - Speech-to-Text)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const btnFalar = document.getElementById('btnFalar');

// Verifica se a API é suportada
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();

    recognition.lang = 'pt-BR'; // ler do select
    recognition.interimResults = false; // false = resultado final
    recognition.continuous = false;   // false = para após um tempo em silêncio

    // EVENTOS
    // Quando a fala é reconhecida
    recognition.onresult = (event) => {
        // Pega o texto reconhecido (o último resultado e a transcrição)
        const speechResult = event.results[event.results.length - 1][0].transcript;
        
        txtTexto.value = speechResult; 
        console.log('Confiança: ' + event.results[event.results.length - 1][0].confidence);
    };

    // Início da escuta (Feedback visual)
    recognition.onstart = () => {
        btnFalar.textContent = '🔴 Escutando...';
        btnFalar.classList.add('bg-red-600', 'hover:bg-red-700');
        btnFalar.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        btnReproduzir.disabled = true; // Desabilita o TTS enquanto escuta
    };

    // Fim da escuta (Restaura o botão)
    recognition.onend = () => {
        btnFalar.textContent = '🎙️ Falar e Transcrever';
        btnFalar.classList.remove('bg-red-600', 'hover:bg-red-700');
        btnFalar.classList.add('bg-blue-600', 'hover:bg-blue-700');
        btnReproduzir.disabled = false;
    };

    // Tratamento de Erro (Ex: Microfone Negado)
    recognition.onerror = (event) => {
        console.error('Erro no Reconhecimento de Fala:', event.error);
        alert('Erro de reconhecimento: ' + event.error + '\nVerifique a permissão do microfone e tente novamente.');
    };


    btnFalar.addEventListener('click', () => {
        try {
            // Se estiver falando, ele não fará nada (o onend cuida da restauração)
            recognition.start();
        } catch (e) {
            console.error(e);
            alert('Aguarde o reconhecimento anterior terminar ou verifique o suporte do navegador.');
        }
    });

} else {
    // Caso o navegador não suporte
    btnFalar.disabled = true;
    btnFalar.textContent = 'API de Fala não suportada';
    console.error('API SpeechRecognition não suportada neste navegador.');
}
