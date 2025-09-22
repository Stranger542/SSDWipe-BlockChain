const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

// Configuration
const certificateConfig = {
    commonName: 'SSD Wipe Certificate Authority',
    countryName: 'US',
    stateOrProvinceName: 'California',
    localityName: 'San Francisco',
    organizationName: 'SSD Wipe Solutions',
    organizationalUnitName: 'Certificate Authority',
    emailAddress: 'ca@ssdwipe.com',
    passphrase: 'ssdwipe123', // You can change this
    keySize: 2048,
    validityYears: 5
};

function generateSelfSignedCertificate() {
    console.log('Generating self-signed certificate...');
    
    // Generate a key pair
    console.log('Generating RSA key pair...');
    const keys = forge.pki.rsa.generateKeyPair(certificateConfig.keySize);
    
    // Create a certificate
    console.log('Creating certificate...');
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + certificateConfig.validityYears);
    
    // Set certificate attributes
    const attrs = [
        { name: 'commonName', value: certificateConfig.commonName },
        { name: 'countryName', value: certificateConfig.countryName },
        { name: 'stateOrProvinceName', value: certificateConfig.stateOrProvinceName },
        { name: 'localityName', value: certificateConfig.localityName },
        { name: 'organizationName', value: certificateConfig.organizationName },
        { name: 'organizationalUnitName', value: certificateConfig.organizationalUnitName },
        { name: 'emailAddress', value: certificateConfig.emailAddress }
    ];
    
    cert.setSubject(attrs);
    cert.setIssuer(attrs); // Self-signed, so issuer = subject
    
    // Set extensions
    cert.setExtensions([
        {
            name: 'basicConstraints',
            cA: true
        },
        {
            name: 'keyUsage',
            keyCertSign: true,
            digitalSignature: true,
            nonRepudiation: true,
            keyEncipherment: true,
            dataEncipherment: true
        },
        {
            name: 'extKeyUsage',
            serverAuth: true,
            clientAuth: true,
            codeSigning: true,
            emailProtection: true,
            timeStamping: true
        },
        {
            name: 'nsCertType',
            client: true,
            server: true,
            email: true,
            objsign: true,
            sslCA: true,
            emailCA: true,
            objCA: true
        }
    ]);
    
    // Self-sign the certificate
    console.log('Self-signing certificate...');
    cert.sign(keys.privateKey, forge.md.sha256.create());
    
    // Create PKCS#12 container
    console.log('Creating PKCS#12 container...');
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
        keys.privateKey,
        cert,
        certificateConfig.passphrase,
        {
            generateLocalKeyId: true,
            friendlyName: 'SSD Wipe Certificate',
            algorithm: '3des'
        }
    );
    
    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    
    // Save the certificate
    const outputPath = path.join(__dirname, 'certificate.p12');
    fs.writeFileSync(outputPath, p12Der, 'binary');
    
    console.log(`✅ Certificate generated successfully!`);
    console.log(`📁 File saved as: ${outputPath}`);
    console.log(`🔑 Passphrase: ${certificateConfig.passphrase}`);
    console.log(`📅 Valid until: ${cert.validity.notAfter.toISOString()}`);
    
    // Also save certificate info as JSON for reference
    const certInfo = {
        subject: attrs.reduce((obj, attr) => {
            obj[attr.name] = attr.value;
            return obj;
        }, {}),
        passphrase: certificateConfig.passphrase,
        serialNumber: cert.serialNumber,
        validFrom: cert.validity.notBefore.toISOString(),
        validUntil: cert.validity.notAfter.toISOString(),
        keySize: certificateConfig.keySize,
        fingerprint: forge.md.sha1.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()).digest().toHex()
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'certificate-info.json'),
        JSON.stringify(certInfo, null, 2)
    );
    
    console.log(`📋 Certificate info saved as: certificate-info.json`);
    
    return {
        certificatePath: outputPath,
        passphrase: certificateConfig.passphrase,
        info: certInfo
    };
}

// Run the generator
if (require.main === module) {
    try {
        generateSelfSignedCertificate();
        console.log('\n🎉 All done! You can now use the certificate.p12 file for PDF signing.');
        console.log('💡 Make sure the passphrase in main.js matches the one shown above.');
    } catch (error) {
        console.error('❌ Error generating certificate:', error);
        process.exit(1);
    }
}

module.exports = { generateSelfSignedCertificate, certificateConfig };