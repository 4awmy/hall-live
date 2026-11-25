const form = document.querySelector('#join-form');
const status = document.querySelector('#join-status');
const qrBox = document.querySelector('#join-qr');
const print = document.querySelector('#print-card');

function isPrivateIPv4(host) {
  const [first, second] = host.split('.').map(Number);
  return /^\d+\.\d+\.\d+\.\d+$/.test(host) &&
    (first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168));
}

if (isPrivateIPv4(location.hostname)) form.elements.address.value = location.origin + '/';

form.addEventListener('input', () => {
  if (!print.disabled) {
    print.disabled = true;
    qrBox.replaceChildren();
    document.querySelector('#printed-address').textContent = '';
    document.querySelector('#printed-network').textContent = 'the hall Wi-Fi';
    status.textContent = 'Make a new QR after changing the join details.';
  }
});

form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const url = new URL(form.elements.address.value);
    const network = form.elements.network.value.trim();
    if (!network) throw Error('Enter the hall Wi-Fi name.');
    if (url.protocol !== 'http:' || !isPrivateIPv4(url.hostname) || url.username || url.password) {
      throw Error('Enter the host’s local address, starting with http:// and using its private IPv4 address.');
    }
    const address = url.origin + '/?follow=1';
    const qr = qrcode(0, 'M');
    qr.addData(address);
    qr.make();
    qrBox.innerHTML = qr.createSvgTag({cellSize: 8, margin: 32, scalable: true, title: 'Open Hall Live'});
    document.querySelector('#printed-network').textContent = network;
    document.querySelector('#printed-address').textContent = address;
    print.disabled = false;
    status.textContent = 'Scan this with a phone on the hall Wi-Fi before printing.';
  } catch (error) {
    status.textContent = error.message;
  }
});

print.addEventListener('click', () => window.print());
