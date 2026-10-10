import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Personagem } from '../models/personagem';

@Injectable({
  providedIn: 'root'
})
export class PersonagemService {

  private apiUrl = 'http://localhost:8080/personagens';

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<Personagem[]> {
    return this.http.get<Personagem[]>(this.apiUrl);
  }

  criar(personagem: Personagem): Observable<Personagem> {
    return this.http.post<Personagem>(
      this.apiUrl,
      personagem
    );
  }

  atualizar(id: number, personagem: Personagem): Observable<Personagem> {
    return this.http.put<Personagem>(
      `${this.apiUrl}/${id}`,
      personagem
    );
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}