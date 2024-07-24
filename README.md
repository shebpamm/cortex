![logo](./images/title.png)

# Cortex

Welcome to the **Cortex** repository! Cortex offers a modern, intuitive, and feature-rich admin interface for managing and monitoring your Elasticsearch clusters. Written in **Rust** and **TypeScript** with **React**, it combines performance with a sleek user experience.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Shard Relocation Information**: Get detailed insights into shard relocation processes, helping you optimize and troubleshoot your cluster.
- **Flowcharts**: Visualize your Elasticsearch cluster's architecture and data flow with interactive flowcharts.
- **Modern UI**: Enjoy a sleek, responsive, and user-friendly interface built with React.
- **Performance**: Leveraging Rust for backend operations ensures high performance and reliability.

## Getting Started

Follow these steps to get Cortex up and running on your local machine.

### Prerequisites

- **Docker**
- **Elasticsearch** (v7.x or higher)

### Running Cortex with Docker

To quickly get Cortex up and running, you can use Docker. Execute the following command:

```bash
docker run --rm --network host --name cortex -e CORTEX_PORT=9999 -e RUST_LOG=trace -it shebpamm/cortex:latest
```

This command will pull the latest version of Cortex from Docker Hub and run it on your local machine. Cortex will be available at `http://localhost:9999`.

## Usage

After running the Docker container, open your browser and navigate to `http://localhost:9999` to access Cortex.

## Contributing

We welcome contributions to Cortex! Please follow these steps to contribute:

1. **Fork the repository**
2. **Create a new branch** (`git checkout -b feature-branch`)
3. **Make your changes**
4. **Commit your changes** (`git commit -m 'Add some feature'`)
5. **Push to the branch** (`git push origin feature-branch`)
6. **Open a Pull Request**

## License

Cortex is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

---

Thank you for using Cortex! If you have any questions or feedback, please feel free to open an issue or contact us. Happy managing!
