class Polygon {
    constructor(vertices, color) {
        this.vertices = vertices;
        this.color = color;
        this.mesh = null;
    }

    createMesh() {
        const shape = new THREE.Shape(this.vertices);
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({ color: this.color, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(geometry, material);

        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const lineSegments = new THREE.LineSegments(edges, lineMaterial);
        this.mesh.add(lineSegments);

        return this.mesh;
    }

    clone() {
        return new Polygon([...this.vertices], this.color);
    }
}

class PolygonCreator {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(
            window.innerWidth / -2, window.innerWidth / 2,
            window.innerHeight / 2, window.innerHeight / -2,
            0.1, 1000
        );
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.camera.position.z = 5;
        this.scene.background = new THREE.Color(0xffffff);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.currentVertices = [];
        this.polygons = [];
        this.tempLine = null;

        this.createGrid();
        this.addEventListeners();

        this.animate();
    }

    createGrid() {
        const gridHelper = new THREE.GridHelper(1000, 100, 0xcccccc, 0xcccccc);
        gridHelper.rotation.x = Math.PI / 2;
        this.scene.add(gridHelper);
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
        document.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
        document.addEventListener('click', (event) => this.onClick(event), false);

        document.getElementById('completeBtn').addEventListener('click', () => this.completePolygon());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyPolygon());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    }

    onWindowResize() {
        this.camera.left = window.innerWidth / -2;
        this.camera.right = window.innerWidth / 2;
        this.camera.top = window.innerHeight / 2;
        this.camera.bottom = window.innerHeight / -2;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (this.currentVertices.length > 0) {
            this.updateTempLine();
        }
    }

    onClick(event) {
        if (event.target.tagName.toLowerCase() === 'button') return;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.scene.children[0]);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.currentVertices.push(new THREE.Vector2(point.x, point.y));

            if (this.currentVertices.length === 1) {
                document.getElementById('completeBtn').style.display = 'inline-block';
            }

            this.updateTempLine();
        }
    }

    updateTempLine() {
        if (this.tempLine) {
            this.scene.remove(this.tempLine);
        }

        const geometry = new THREE.BufferGeometry().setFromPoints([
            ...this.currentVertices,
            new THREE.Vector3(this.mouse.x * this.camera.right, this.mouse.y * this.camera.top, 0)
        ]);
        const material = new THREE.LineBasicMaterial({ color: 0x000000 });
        this.tempLine = new THREE.Line(geometry, material);
        this.scene.add(this.tempLine);
    }

    completePolygon() {
        if (this.currentVertices.length < 3) return;

        const color = new THREE.Color(Math.random(), Math.random(), Math.random());
        const polygon = new Polygon(this.currentVertices, color);
        const mesh = polygon.createMesh();
        this.scene.add(mesh);
        this.polygons.push(polygon);

        this.currentVertices = [];
        if (this.tempLine) {
            this.scene.remove(this.tempLine);
            this.tempLine = null;
        }

        document.getElementById('completeBtn').style.display = 'none';
        document.getElementById('copyBtn').style.display = 'inline-block';
    }

    copyPolygon() {
        if (this.polygons.length === 0) return;

        const lastPolygon = this.polygons[this.polygons.length - 1];
        const copiedPolygon = lastPolygon.clone();
        const mesh = copiedPolygon.createMesh();

        mesh.position.set(this.mouse.x * this.camera.right, this.mouse.y * this.camera.top, 0);

        this.scene.add(mesh);
        this.polygons.push(copiedPolygon);
    }

    reset() {
        for (const polygon of this.polygons) {
            this.scene.remove(polygon.mesh);
        }
        this.polygons = [];
        this.currentVertices = [];
        if (this.tempLine) {
            this.scene.remove(this.tempLine);
            this.tempLine = null;
        }

        document.getElementById('completeBtn').style.display = 'none';
        document.getElementById('copyBtn').style.display = 'none';
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

new PolygonCreator();