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

  public irParaCadastro(): void {
    this.router.navigate(['/cadastro']);
  }
}
