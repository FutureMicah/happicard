# Card Delight


</div>

<script>
const cardInput = document.getElementById('card-number');
const expiryInput = document.getElementById('expiry');
const cvvInput = document.getElementById('cvv');
const visaLogo = document.querySelector('.visa');
const mcLogo = document.querySelector('.mastercard');

// Format card number with spaces
cardInput.addEventListener('input', (e) => {
let value = e.target.value.replace(/\D/g, '').substring(0, 16);
let formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
e.target.value = formatted;

detectBrand(value);
});

// Basic brand detection
function detectBrand(number) {
visaLogo.style.display = 'none';
mcLogo.style.display = 'none';

if (/^4/.test(number)) {
visaLogo.style.display = 'block';
} else if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) {
mcLogo.style.display = 'block';
}
}

// Format expiry as MM / YY
expiryInput.addEventListener('input', (e) => {
let value = e.target.value.replace(/\D/g, '').substring(0, 4);
if (value.length >= 3) {
value = value.substring(0, 2) + ' / ' + value.substring(2);
}
e.target.value = value;
});

// Only numbers for CVV
cvvInput.addEventListener('input', (e) => {
e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
});

// Demo button – does nothing harmful
document.getElementById('pay-btn').addEventListener('click', () => {
alert('make appropriate payment .');
});
</script>
</body>
</html>

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://happy-card-formatter.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/596db99c-e198-4184-bcf4-6bc6a9112a81).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
