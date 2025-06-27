<!-- Based on https://github.com/othneildrew/Best-README-Template/blob/master/README.md -->
<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a name="readme-top"></a>

<!-- PROJECT LOGO -->
<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/1280px-Node.js_logo.svg.png" alt="Logo" height="80">
  <h3 align="center">IA course by Codely TV</h3>
</div>

<!-- ABOUT THE PROJECT -->
## About The Project

IA course by Codely TV

### Built With

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Nodemon](https://img.shields.io/badge/NODEMON-%23323330.svg?style=for-the-badge&logo=nodemon&logoColor=%BBDEAD)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

You just need git and node installed in your computer to use this template

### Installation

1. Clone the repo
   ```sh
   git clone git@github.com:samuelcasanova/node-template.git
   ```
2. Install dependencies
   ```sh
   npm install
   ```

### Infrastructure startup/teardown

1. Start the Ollama and Postgres servers
   ```sh
   docker compose up
   ```
2. Tear down the servers
   ```sh
   docker compose down
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Use the search powered with embeddings

1. Run the nomic model in the Ollama server
   ```sh
   npm run model:search
   ```
2. Create the catalogue products with the embeddings in the DB
   ```sh
   npm run create
   ```
3. Run the search
   ```sh
   npm run search -- "I would like a sandwich"
   ```

### Use the product recommender based on your basket

1. Run the Llama3 model in the Ollama server
   ```sh
   npm run model:recommend
   ```
2. Run the recommender using Llama 3 model over Ollama
   ```sh
   npm run recommend -- ollama "ISG02036,ISS00014,ISS00006"
   ```
or
1. Run the recommender using Google Cloud Gemini model
   ```sh
   GOOGLE_GENAI_API_KEY=YOUR_API_KEY npm run recommend -- gemini "ISG02036,ISS00014,ISS00006"
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Samuel Casanova - [@casanovasamuel](https://twitter.com/casanovasamuel) - samuel.casanova@gmail.com

Project Link: [https://github.com/samuelcasanova/node-template](https://github.com/samuelcasanova/node-template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[react-shield]: https://img.shields.io/badge/react
[react-url]: https://react.dev/
