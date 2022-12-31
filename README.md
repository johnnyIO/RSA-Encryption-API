This file is a node js script tha contains codes that forms the endpont of an RSA encryption program, the API has endpoint exposed to users for 
1. Key Generation -> This allows users to generate both public and private key
2. RSA Encryption -> This allows users to encrypt file, this endpoint expects that user provide it with a plaintext and a key (public key), which is used to encipher the plaintext
3. RSA Decryption -> This allows users particularly the reciever of the ciphertext to convert it back to plaintext by providing, the private key and ciphertext to this endpoint which is used to convert the encrypted file back to plaintform 
