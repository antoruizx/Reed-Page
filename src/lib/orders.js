// Guarda la clave de los pedidos hechos sin cuenta, para poder volver a verlos
const KEY = "reed.orders";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function rememberOrder(id, accessKey) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), [id]: accessKey }));
  } catch {
    /* sin almacenamiento */
  }
}

export const orderKey = (id) => read()[id];
