import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios, { AxiosInstance } from 'axios';
import { Model } from 'mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { PokemonAPI } from './interfaces/pokemonApi.interface';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';


@Injectable()
export class SeedService {


  

  constructor(
    @InjectModel(Pokemon.name) 
    private readonly pokemonModel: Model<Pokemon>,
    private readonly http: AxiosAdapter
  ){}

  async executeSEED() {
    await this.pokemonModel.deleteMany({});
    const data = await this.http.get<PokemonAPI>(`https://pokeapi.co/api/v2/pokemon/?limit=650`);
    
    //const insertPromisesArray: any = [];
    const pokemonsInsert : { name: string, no: number }[] = []

    data.results.forEach( ({ name, url}) => {

      const segments = url.split('/');
      const no = +segments [ segments.length - 2];

      //await this.pokemonModel.create({ name, no });

      /* insertPromisesArray.push(
        this.pokemonModel.create({ name, no })
      );*/

      pokemonsInsert.push({name, no});
    
    });

    await this.pokemonModel.insertMany( pokemonsInsert );

    //await Promise.all(insertPromisesArray);

    return `seed ejecutado exitosamente!`
  }
}
