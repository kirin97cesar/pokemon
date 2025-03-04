import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {
  private defaultLimit;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService
  ) {
    this.defaultLimit = this.configService.getOrThrow<number>('defaultLimit')
  }

  
  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase()
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions(error);
    }

  }

  findAll({ limit = +this.defaultLimit, offset = 0 } : PaginationDto) {
    return this.pokemonModel
      .find()
      .limit( limit )
      .skip( offset )
      .sort({
        no: 1
      })
      .select('-__v');
  }

  async findOne(term: string) {
    let pokemon : Pokemon | any;

    if(! isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: term});
    }

    if (!pokemon && isValidObjectId( term )) {
      pokemon = await this.pokemonModel.findById( term );
    }

    if(!pokemon) {
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase().trim() })
    }

    if(!pokemon) throw new NotFoundException(`No se encontro el termino de busqueda! ${term}`)

    return pokemon;

  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);
    updatePokemonDto.name = updatePokemonDto.name?.toLowerCase().trim();
    
    try {
      await pokemon.updateOne(updatePokemonDto)
      return { ...pokemon.toJSON(), ...updatePokemonDto }
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    //const pokemon = await this.findOne(id);
    //await pokemon.deleteOne();
    //const deletePokemon = await this.pokemonModel.findByIdAndDelete(id);
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id});
    if(deletedCount === 0) {
      throw new NotFoundException(`No se pudo eliminar, no se encontro el pokemon`)
    }
  }

  private handleExceptions( error: any) {
    if(error.code === 11000) {
      throw new BadRequestException(`Ya existe este pokemon ${JSON.stringify(error.errmsg)}`)
    }
    throw new InternalServerErrorException(`No se pudo crear/actualizar el pokemon`)
  }
}
