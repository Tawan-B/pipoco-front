import { Component, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Celula {
  x: number;
  y: number;
}

interface Inimigo extends Celula {
  id: number;
  direcao: number;
}

interface Bomba extends Celula {
  id: number;
  explodindo: boolean;
  explosao: Celula[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnDestroy {

  personagemEscolhido = false;
  imagemSelecionada = '/c6c36f2f-c1e7-4efc-978f-f349d1842470.png';

  readonly colunas = 13;
  readonly linhas = 13;
  readonly tamanhoCelula = 40;

  jogadorX = 1;
  jogadorY = 1;

  jogoConcluido = false;

  obstaculos: Celula[] = [];
  inimigos: Inimigo[] = [];
  bombas: Bomba[] = [];

  private proximoId = 1;
  private temporizadores: ReturnType<typeof setTimeout>[] = [];
  private intervaloInimigos?: ReturnType<typeof setInterval>;

  constructor(
    private router: Router,
    private httpClient: HttpClient
  ) {
    this.criarMapa();
  }

  private criarMapa(): void {
    this.obstaculos = [];

    for (let y = 0; y < this.linhas; y++) {
      for (let x = 0; x < this.colunas; x++) {

        const borda =
          x === 0 ||
          y === 0 ||
          x === this.colunas - 1 ||
          y === this.linhas - 1;

        const pilar =
          x % 2 === 0 &&
          y % 2 === 0;

        if (borda || pilar) {
          this.obstaculos.push({ x, y });
        }
      }
    }
  }

  escolherPersonagem(caminhoImagem: string): void {
    this.imagemSelecionada = caminhoImagem;
    this.personagemEscolhido = true;
    this.reiniciar();
  }

  trocarPersonagem(): void {
    this.pararInimigos();
    this.personagemEscolhido = false;
  }

  deletarConta(): void {
    if (!confirm('Tem certeza que deseja excluir sua conta permanentemente?')) {
      return;
    }

    const usuarioSalvo = localStorage.getItem('usuario');
    if (!usuarioSalvo) {
      alert('Nenhum usuário logado encontrado.');
      this.voltarLogin();
      return;
    }

    const usuario = JSON.parse(usuarioSalvo);
    const usuarioId = usuario.id;

    if (!usuarioId) {
      alert('ID do usuário inválido.');
      return;
    }

    this.httpClient.delete(`http://localhost:8080/usuarios/${usuarioId}`).subscribe({
      next: () => {
        alert('Conta excluída com sucesso.');
        localStorage.removeItem('usuario');
        this.router.navigate(['/login']);
      },
      error: (erro) => {
        console.error('Erro ao deletar conta:', erro);
        alert('Não foi possível excluir a conta. Verifique o servidor.');
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  movimentar(event: KeyboardEvent): void {
    if (!this.personagemEscolhido || this.jogoConcluido) {
      return;
    }

    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']
        .includes(event.key)
    ) {
      event.preventDefault();
    }

    if (event.key === ' ') {
      this.colocarBomba();
      return;
    }

    let x = this.jogadorX;
    let y = this.jogadorY;

    switch (event.key) {
      case 'ArrowUp':
        y--;
        break;
      case 'ArrowDown':
        y++;
        break;
      case 'ArrowLeft':
        x--;
        break;
      case 'ArrowRight':
        x++;
        break;
      default:
        return;
    }

    if (!this.ehObstaculo(x, y) && !this.temBomba(x, y)) {
      this.jogadorX = x;
      this.jogadorY = y;
    }
  }

  private ehObstaculo(x: number, y: number): boolean {
    return this.obstaculos.some(obs => obs.x === x && obs.y === y);
  }

  private temBomba(x: number, y: number): boolean {
    return this.bombas.some(
      bomba => bomba.x === x && bomba.y === y
    );
  }

  private colocarBomba(): void {
    if (this.bombas.length > 0) {
      return;
    }

    const bomba: Bomba = {
      id: this.proximoId++,
      x: this.jogadorX,
      y: this.jogadorY,
      explodindo: false,
      explosao: []
    };

    this.bombas = [...this.bombas, bomba];

    this.agendar(() => this.explodir(bomba), 1800);
  }

  private explodir(bomba: Bomba): void {
    if (this.jogoConcluido) {
      return;
    }

    const atingidas: Celula[] = [
      { x: bomba.x, y: bomba.y }
    ];

    const direcoes = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];

    for (const direcao of direcoes) {
      for (let passo = 1; passo <= 2; passo++) {
        const x = bomba.x + direcao.x * passo;
        const y = bomba.y + direcao.y * passo;

        if (this.ehObstaculo(x, y)) {
          break;
        }

        atingidas.push({ x, y });
      }
    }

    bomba.explodindo = true;
    bomba.explosao = atingidas;
    this.bombas = [...this.bombas];

    this.inimigos = this.inimigos.filter(inimigo =>
      !atingidas.some(c => c.x === inimigo.x && c.y === inimigo.y)
    );

    this.agendar(() => {
      this.bombas = this.bombas.filter(b => b.id !== bomba.id);
    }, 450);

    this.verificarVitoria();
  }

  private criarInimigos(): void {
    const posicoes: Celula[] = [
      { x: 11, y: 1 },
      { x: 11, y: 11 },
      { x: 1, y: 11 },
      { x: 7, y: 11 }
    ];

    this.inimigos = posicoes.map(posicao => ({
      ...posicao,
      id: this.proximoId++,
      direcao: Math.floor(Math.random() * 4)
    }));
  }

  private moverInimigos(): void {
    if (this.jogoConcluido || !this.personagemEscolhido) {
      return;
    }

    const direcoes = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];

    this.inimigos = this.inimigos.map(inimigo => {
      const direcao = direcoes[
        Math.floor(Math.random() * direcoes.length)
      ];

      const x = inimigo.x + direcao.x;
      const y = inimigo.y + direcao.y;

      if (
        this.ehObstaculo(x, y) ||
        this.temBomba(x, y) ||
        this.inimigos.some(
          outro =>
            outro.id !== inimigo.id &&
            outro.x === x &&
            outro.y === y
        )
      ) {
        return inimigo;
      }

      return { ...inimigo, x, y };
    });
  }

  private verificarVitoria(): void {
    if (this.inimigos.length === 0) {
      this.jogoConcluido = true;
      this.pararInimigos();
    }
  }

  private iniciarInimigos(): void {
    this.pararInimigos();

    this.intervaloInimigos = setInterval(() => {
      this.moverInimigos();
    }, 600);
  }

  private pararInimigos(): void {
    if (this.intervaloInimigos) {
      clearInterval(this.intervaloInimigos);
      this.intervaloInimigos = undefined;
    }
  }

  private agendar(acao: () => void, atraso: number): void {
    const temporizador = setTimeout(acao, atraso);
    this.temporizadores.push(temporizador);
  }

  reiniciar(): void {
    this.pararInimigos();

    this.temporizadores.forEach(clearTimeout);
    this.temporizadores = [];

    this.jogadorX = 1;
    this.jogadorY = 1;
    this.jogoConcluido = false;
    this.bombas = [];

    this.criarMapa();
    this.criarInimigos();
    this.iniciarInimigos();
  }

  voltarLogin(): void {
    this.pararInimigos();

    this.temporizadores.forEach(clearTimeout);
    this.temporizadores = [];

    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.pararInimigos();
    this.temporizadores.forEach(clearTimeout);
  }
}
