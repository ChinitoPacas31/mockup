const API_URL = 'http://192.168.1.144/api';  // Cambia a tu IP o URL pública

export async function login(email) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function registro(nombre, email) {
  const res = await fetch(`${API_URL}/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email }),
  });
  return res.json();
}

export async function getIncubadoras(user_id) {
  const res = await fetch(`${API_URL}/incubadoras/${user_id}`);
  return res.json();
}

export async function addIncubadora(data) {
  const res = await fetch(`${API_URL}/incubadoras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
