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
  selector: 'app-cadastro',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css'
})
export class Cadastro implements OnInit {

  cadastroForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private httpClient: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.criarFormulario();
  }

  private criarFormulario(): void {
    this.cadastroForm = this.formBuilder.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required]
    });
  }

  public enviarDados(): void {

    console.log('Formulário válido:', this.cadastroForm.valid);
    console.log('Dados:', this.cadastroForm.getRawValue());

    if (this.cadastroForm.valid) {

      this.httpClient.post(
        'http://localhost:8080/usuarios',
        this.cadastroForm.getRawValue()
      ).subscribe({
        next: (resposta) => {
          console.log('Resposta do backend:', resposta);
          alert('Cadastro realizado com sucesso!');
          this.router.navigate(['/login']);
        },
        error: (erro) => {
          console.error('Erro ao cadastrar:', erro);
          alert('Não foi possível cadastrar. Confira o console.');
        }
      });

    }
  }

  public voltarLogin(): void {
    this.router.navigate(['/login']);
  }
}

