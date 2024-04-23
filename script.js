(async () => {
const keyTextarea = document.querySelector(".keys");
const genKeysBtn = document.querySelector(".generate-keys");
const saveKeysBtn = document.querySelector(".save-keys");
const encryptTextarea = document.querySelector(".enc");
const encryptButton = document.querySelector(".encrypt");
const decryptTextarea = document.querySelector(".dec");
const decryptButton = document.querySelector(".decrypt");
const theirsPub = document.querySelector(".their-pub");
const copyPublicKey = document.querySelector(".copy-pub");

const outputTextarea = document.querySelector(".output");

const keys = localStorage.getItem("keys");
let keyPair;
if (keys && localStorage.getItem("notFirstTimeRSA")) {
    keyTextarea.textContent = keys;
    keyPair = JSON.parse(keys);
    keyPair = {
        publicKey: await importKey("jwk", keyPair.publicKey, 0),
        privateKey: await importKey("jwk", keyPair.privateKey, 1)
    }
}

localStorage.setItem("notFirstTimeRSA", "true");


function genKeyPair() {
    // Generate RSA key pair
    crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: {name: "SHA-256"}
        },
        true,
        ["encrypt", "decrypt"]
    ).then(async res => {
        keyPair = {
            publicKey: await exportKey("jwk", res.publicKey),
            privateKey: await exportKey("jwk", res.privateKey)
        };

        keyTextarea.textContent = JSON.stringify(keyPair);

        keyPair = {
            publicKey: await importKey("jwk", keyPair.publicKey, 0),
            privateKey: await importKey("jwk", keyPair.privateKey, 1)
        }
    });
}

async function exportKey(name, key) {
    return await crypto.subtle.exportKey(name, key);
}

async function importKey(name, key, usedFor) {
    return await crypto.subtle.importKey(
        name,
        key,
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: {name: "SHA-256"}
        },
        true,
        [usedFor === 1 ? "decrypt" : "encrypt"]
    );
}

genKeysBtn.addEventListener("click", () => {
    genKeyPair();
});

saveKeysBtn.addEventListener("click", () => {
    localStorage.setItem("keys", JSON.stringify(keyPair));
});

async function encNdec({ target }) {
    if (target.className.includes("encrypt")) {
        const message = new TextEncoder().encode(encryptTextarea.value);
        const encrypted = await crypto.subtle.encrypt(
            { name: "RSA-OAEP" }, 
            await crypto.subtle.importKey("jwk", JSON.parse(theirsPub.value), { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: { name: "SHA-256" } }, false, ["encrypt"]),
            message
        );
        outputTextarea.value = Array.from(new Uint8Array(encrypted)).map(x => x.toString(16)).join("|");
        
    } else if (target.className.includes("decrypt")) {
        const message = decryptTextarea.value.split("|");
        let temp = new Uint8Array(message.length);
        for (let i = 0; i < message.length; i++) {
            temp[i] = parseInt(message[i], 16);
        }

        arrayBuffer = temp.buffer;

        const decrypted = await crypto.subtle.decrypt(
            { name: "RSA-OAEP" }, keyPair.privateKey, arrayBuffer
        );
        outputTextarea.value = new TextDecoder().decode(decrypted);
    }
}

encryptButton.addEventListener("click", encNdec);
decryptButton.addEventListener("click", encNdec);

copyPublicKey.addEventListener("click", async () => {
    navigator.clipboard.writeText(JSON.stringify(
        await crypto.subtle.exportKey("jwk", keyPair.publicKey)
    ));
})
})();