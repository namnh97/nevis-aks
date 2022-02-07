var e2eenc = function() {

	this.encryptForm = function(algoString, formId) {
		// TODO: in case of an error we should return false, to prevent the for to be submitted
		//       or replace the fields with dummy values, just to prevent the the transmission
		//       of unencrypted values
		

		// create the array of input fields to encrypt (needs to be done before setting the form
		// invisible
		var fieldsToEncrypt = new Array();
		$.each($("form input:visible"), function(index, _inputField) { fieldsToEncrypt.push($(_inputField));});

		// hide the form, and display the splash screen
		$('#loginform').css('display','none');
		$('#e2eeSplashScreen').css('display','block');

		// encryption logic
		var pubKey = $("input[name='e2eenc.publicKey']").val();

		var kemSessionKey = readPublicKeyAndGenerateSessionKey(pubKey)
		var iv = forge.random.getBytesSync(16);
		keyB64 = forge.util.encode64(kemSessionKey.key);
		encapsulationB64 = forge.util.encode64(kemSessionKey.encapsulation);
		ivB64 = forge.util.encode64(iv);

		//console.log("Encrypting form " + formId + " (" + algoString + ")");
		var fields = "";
		$.each(fieldsToEncrypt, function(index, _inputField) {
			var inputField = $(_inputField);
			if (inputField.attr("type") == "text" || inputField.attr("type") == "password") {
				//console.log("Encrypting field " + JSON.stringify(inputField));
				var plainValue = inputField.val();

				var encryptedValueB64 = encrypt(kemSessionKey, iv, plainValue);
				//console.log("Setting encrypted value in b64: " + encryptedValueB64);
				inputField.val(encryptedValueB64);
				if (fields.length > 0) {
					fields = fields + ","
				}
				fields = fields + inputField.attr("name");
			}
		});
		$("input[name='e2eenc.iv']").val(ivB64);
		$("input[name='e2eenc.encapsulation']").val(encapsulationB64);
		$("input[name='e2eenc.fields']").val(fields);
	}

	function getRSApublicKey(pem) {
	    //console.log("PEM: " + pem);

	    var msg = forge.pem.decode(pem)[0];

	    //console.log("msg type: " + msg.type);

	    if(msg.procType && msg.procType.type === 'ENCRYPTED') {
		throw new Error('Could not retrieve RSA public key from PEM; PEM is encrypted.');
	    }

	    // convert DER to ASN.1 object
	    var asn1obj = forge.asn1.fromDer(msg.body);
	    //console.log("ASN.1 obj: " + JSON.stringify(asn1obj))

	    var pubKey = forge.pki.publicKeyFromAsn1(asn1obj)
	    //console.log("PubKey: " + JSON.stringify(pubKey))
	    return pubKey;
	}

	function generateKEMSessionKey(rsaPublicKey) {
	    // generate key-derivation-function and initializes it with sha1
	    var kdf1 = new forge.kem.kdf1(forge.md.sha1.create());
	    // creates a KEM function based on the key-derivation-function created above
	    var kem = forge.kem.rsa.create(kdf1);
	    // generate and encapsulate a 16-byte secret key. 
	    // The secret key is generated using the kdf defined above.
	    var kemSessionKey = kem.encrypt(rsaPublicKey, 16);
	    // kemSessionKey has 'encapsulation' (= pub key) and 'key' (= generated secret key)
	    return kemSessionKey;
	}

	function readPublicKeyAndGenerateSessionKey(pem) {
	    var rsaPublicKey = getRSApublicKey(pem);
	    //console.log("PubKey: " + JSON.stringify(rsaPublicKey))
	    var kemSessionKey = generateKEMSessionKey(rsaPublicKey);
	    //console.log("KEM session key: " + JSON.stringify(kemSessionKey))
	    return kemSessionKey;
	}

	function encrypt(kemSessionKey, iv, msg) {
		var cipher = forge.cipher.createCipher('AES-CBC', kemSessionKey.key);
		cipher.start({iv: iv});
		cipher.update(forge.util.createBuffer(msg, 'utf-8'));
		cipher.finish();
		var encrypted = cipher.output.getBytes();
		encryptedB64 = forge.util.encode64(encrypted);
		return encryptedB64;
	}
};
