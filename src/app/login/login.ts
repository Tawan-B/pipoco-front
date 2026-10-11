import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {

  loginForm!: FormGroup;
  recuperarForm!: FormGroup;
  
  recuperandoSenha = false;

  constructor(
    private formBuilder: FormBuilder,
    private httpClient: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required]
    });

    this.recuperarForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      novaSenha: ['', Validators.required]
    });
  }

  public alternarRecuperacao(valor: boolean): void {
    this.recuperandoSenha = valor;
  }

  public enviarDados(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.httpClient.get<any[]>(
      'http://localhost:8080/usuarios'
    ).subscribe({
      next: (usuarios) => {
        const dados = this.loginForm.getRawValue();

        const usuarioEncontrado = usuarios.find(
          usuario =>
            usuario.email === dados.email &&
            usuario.senha === dados.senha
        );

        if (usuarioEncontrado) {
          localStorage.setItem(
            'usuario',
            JSON.stringify(usuarioEncontrado)
          );

          this.router.navigate(['/home']);
        } else {
          alert('Email ou senha incorretos.');
        }
      },
      error: (erro) => {
        console.error('Erro ao consultar usuários:', erro);
        alert('Não foi possível conectar ao servidor.');
      }
    });
  }

  public atualizarSenha(): void {
    if (this.recuperarForm.invalid) {
      return;
    }

    const dadosRecuperacao = this.recuperarForm.getRawValue();

    this.httpClient.get<any[]>(
      'http://localhost:8080/usuarios'
    ).subscribe({
      next: (usuarios) => {
        const usuarioEncontrado = usuarios.find(
          u => u.email === dadosRecuperacao.email
        );

        if (!usuarioEncontrado) {
          alert('E-mail não encontrado no sistema.');
          return;
        }

        const usuarioAtualizado = {
          ...usuarioEncontrado,
          senha: dadosRecuperacao.novaSenha
        };

        this.httpClient.put(
          `http://localhost:8080/usuarios/${usuarioEncontrado.id}`,
          usuarioAtualizado
        ).subscribe({
          next: () => {
            alert('Senha alterada com sucesso! Faça login com a nova senha.');
            this.recuperarForm.reset();
            this.alternarRecuperacao(false);
          },
          error: (erro) => {
            console.error('Erro ao atualizar senha:', erro);
            alert('Não foi possível atualizar a senha. Verifique a API.');
          }
        });
      },
      error: (erro) => {
        console.error('Erro ao buscar usuário:', erro);
        alert('Erro ao conectar com o servidor.');
      }
    });
  }

  public irParaCadastro(): void {
    this.router.navigate(['/cadastro']);
  }
}
