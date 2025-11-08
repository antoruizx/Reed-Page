import React, { useState } from "react";
import Carousel from "react-bootstrap/Carousel";
import "../Styles/HomePage.css";
import Img1 from "../assets/img/img1.jpg";
import Img2 from "../assets/img/img2.jpg";
import Img4 from "../assets/img/img4.jpg";
import { Col, Container, Row, Card, Button } from "react-bootstrap";
import Card1 from "../assets/img/card1.jpg";
import { Link } from "react-router-dom";
import PaymentMethods from "../components/PaymentMethods";


const sampleProducts = [
  {
    id: "p1",
    title: "Hoodie Neon",
    image: Img1,
    price: 7990,
    colors: ["Black", "White", "Neon"],
  },
  {
    id: "p2",
    title: "T-Shirt Basic",
    image: Img2,
    price: 3490,
    colors: ["White", "Grey"],
  },
  {
    id: "p3",
    title: "Accessory Cap",
    image: Img4,
    price: 1590,
    colors: ["Black"],
  },
  {
    id: "p4",
    title: "Jogger",
    image: Card1,
    price: 9990,
    colors: ["Khaki", "Black", "Navy"],
  },
];

function calcCuotas(price, cuotas = 6) {
  const val = (price / cuotas).toFixed(0);
  return `${cuotas} x $${val}`;
}

const HomePage = () => {
  const [touchActive, setTouchActive] = useState(null); // id del card tocada (mobile)

  function handleCardTouch(e, id) {
    if (touchActive !== id) {
      e.preventDefault();
      setTouchActive(id);
      setTimeout(() => {
        if (touchActive === id) setTouchActive(null);
      }, 6000);
    } else {
      setTouchActive(null);
      alert("Comprar producto (simulado): " + id);
    }
  }

  return (
    <>
      <Carousel className="custom-carousel" fade indicators={false}>
        <Carousel.Item interval={3000}>
          <img className="d-block w-100 carousel-full" src={Img1} alt="First slide" />
          <Carousel.Caption>
            <h3>Hoodies</h3>
            <p className="d-none d-sm-block color-text">
              Nulla vitae elit libero, a pharetra augue mollis interdum.
            </p>
          </Carousel.Caption>
        </Carousel.Item>

        <Carousel.Item interval={3000}>
          <img className="d-block w-100 carousel-full" src={Img2} alt="Second slide" />
          <Carousel.Caption>
            <h3>T-shirts</h3>
            <p className="d-none d-sm-block">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          </Carousel.Caption>
        </Carousel.Item>

        <Carousel.Item interval={3000}>
          <img className="d-block w-100 carousel-full" src={Img4} alt="Third slide" />
          <Carousel.Caption>
            <h3>Accessories</h3>
            <p className="d-none d-sm-block">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>

      <Container fluid>
        <Col className="text-center">
          <section className="newin-section container mt-5">
            <div className="text-center mb-4">
                <h3 className="newin-title">New in</h3>
            </div>

            <Row xs={1} sm={2} md={2} lg={4} className="g-3">
              {sampleProducts.map((p) => (
                <Col key={p.id}>
                  <article
                    className={`product-card ${touchActive === p.id ? "touch-active" : ""}`}
                    onTouchStart={(e) => handleCardTouch(e, p.id)}
                    onClick={() => {
                      if (!("ontouchstart" in window)) {
                        alert("Abrir detalle (simulado): " + p.title);
                      }
                    }}
                  >
                    <div className="product-media">
                      <img src={p.image} alt={p.title} />
                    </div>

                    <div className="product-body">
                      <h5 className="product-title">{p.title}</h5>
                      <p className="product-price">${p.price}</p>
                      <p className="product-colors">Colores: {p.colors.join(", ")}</p>
                      <p className="product-cuotas text-muted">{calcCuotas(p.price, 6)}</p>
                    </div>

                    <div className="product-actions">
                      <Button
                        className="buy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert("Comprar (simulado): " + p.title);
                        }}
                      >
                        Comprar
                      </Button>
                    </div>
                  </article>
                </Col>
              ))}
            </Row>
            <br/>
        <div className="text-center mt-4">
          <Link to="/catalogo" className="btn btn-verde">
            Ver catálogo
          </Link>
        </div>

          </section>
        </Col>

        {/* Categorías 2x2 */}
<section className="categories-section text-center my-5">
  <h2 className="categories-title mb-4">Categorías</h2>
  <div className="categories-grid">
    <Link to="/catalogo?cat=hoodies" className="category-card">
      <img src={Img1} alt="Hoodies" className="category-img" />
      <div className="overlay">
        <span>Hoodies</span>
      </div>
    </Link>

    <Link to="/catalogo?cat=tshirts" className="category-card">
      <img src={Img2} alt="T-Shirts" className="category-img" />
      <div className="overlay">
        <span>T-Shirts</span>
      </div>
    </Link>

    <Link to="/catalogo?cat=accesories" className="category-card">
      <img src={Img4} alt="Accesorios" className="category-img" />
      <div className="overlay">
        <span>Accesorios</span>
      </div>
    </Link>

    <Link to="/catalogo?cat=custom" className="category-card">
      <img src={Card1} alt="Custom" className="category-img" />
      <div className="overlay">
        <span>Custom</span>
      </div>
    </Link>
  </div>
</section>

        <hr />
      </Container>
      <PaymentMethods />
    </>
  );
};

export default HomePage;
